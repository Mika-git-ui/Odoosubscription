from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, case, and_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import (
    Subscription,
    Invoice,
    Payment,
)
from app.routers.auth import require_roles

router = APIRouter(prefix="/reports", tags=["Reports"])

CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def money(value):
    return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)


def get_paid_subquery(db: Session):
    return (
        db.query(
            Payment.invoice_id.label("invoice_id"),
            func.coalesce(func.sum(Payment.amount), 0).label("paid_amount")
        )
        .group_by(Payment.invoice_id)
        .subquery()
    )


# REPORT SUMMARY
@router.get("/summary")
def report_summary(
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date"
        )

    # 1. Active subscriptions count
    active_subscriptions = db.query(
        func.count(Subscription.id)
    ).filter(
        Subscription.status == "active"
    ).scalar() or 0

    # 2. Revenue received based on actual payments
    payment_query = db.query(
        func.coalesce(func.sum(Payment.amount), 0)
    )
    if date_from:
        payment_query = payment_query.filter(Payment.payment_date >= date_from)
    if date_to:
        payment_query = payment_query.filter(Payment.payment_date <= date_to)

    revenue_received = money(payment_query.scalar())

    # 3. Database-level aggregation for outstanding & overdue invoices
    paid_sub = get_paid_subquery(db)
    balance_expr = Invoice.total_amount - func.coalesce(paid_sub.c.paid_amount, 0)
    today = date.today()

    agg_query = (
        db.query(
            func.coalesce(
                func.sum(case((balance_expr > 0, balance_expr), else_=ZERO)),
                ZERO
            ).label("outstanding_amount"),
            func.count(
                case((balance_expr > 0, Invoice.id), else_=None)
            ).label("outstanding_count"),
            func.coalesce(
                func.sum(case((and_(balance_expr > 0, Invoice.due_date < today), balance_expr), else_=ZERO)),
                ZERO
            ).label("overdue_amount"),
            func.count(
                case((and_(balance_expr > 0, Invoice.due_date < today), Invoice.id), else_=None)
            ).label("overdue_count"),
        )
        .outerjoin(paid_sub, Invoice.id == paid_sub.c.invoice_id)
        .filter(Invoice.status == "confirmed")
    )

    if date_from:
        agg_query = agg_query.filter(Invoice.issue_date >= date_from)
    if date_to:
        agg_query = agg_query.filter(Invoice.issue_date <= date_to)

    agg_row = agg_query.first()

    outstanding_amount = money(agg_row.outstanding_amount) if agg_row else ZERO
    outstanding_count = int(agg_row.outstanding_count or 0) if agg_row else 0
    overdue_amount = money(agg_row.overdue_amount) if agg_row else ZERO
    overdue_count = int(agg_row.overdue_count or 0) if agg_row else 0

    return {
        "active_subscriptions": active_subscriptions,
        "revenue_received": str(revenue_received),
        "outstanding_amount": str(outstanding_amount),
        "outstanding_invoice_count": outstanding_count,
        "overdue_amount": str(overdue_amount),
        "overdue_invoice_count": overdue_count,
        "date_from": str(date_from) if date_from else None,
        "date_to": str(date_to) if date_to else None,
    }


# OVERDUE INVOICE REPORT
@router.get("/overdue-invoices")
def overdue_invoices(
    date_from: date | None = None,
    date_to: date | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date"
        )

    paid_sub = get_paid_subquery(db)
    balance_expr = Invoice.total_amount - func.coalesce(paid_sub.c.paid_amount, 0)
    today = date.today()

    # Base filter conditions
    base_filters = [
        Invoice.status == "confirmed",
        Invoice.due_date < today,
        balance_expr > 0
    ]
    if date_from:
        base_filters.append(Invoice.issue_date >= date_from)
    if date_to:
        base_filters.append(Invoice.issue_date <= date_to)

    # 1. Total overdue amount & count calculated entirely in the DB
    totals_query = (
        db.query(
            func.coalesce(func.sum(balance_expr), ZERO).label("total_overdue"),
            func.count(Invoice.id).label("total_count")
        )
        .outerjoin(paid_sub, Invoice.id == paid_sub.c.invoice_id)
        .filter(*base_filters)
    )
    totals_row = totals_query.first()
    total_overdue = money(totals_row.total_overdue) if totals_row else ZERO
    total_count = int(totals_row.total_count or 0) if totals_row else 0

    # 2. Database-level pagination with column projection (avoids full entity loading)
    paged_query = (
        db.query(
            Invoice.id.label("invoice_id"),
            Invoice.invoice_number.label("invoice_number"),
            Invoice.customer_id.label("customer_id"),
            Invoice.subscription_id.label("subscription_id"),
            Invoice.issue_date.label("issue_date"),
            Invoice.due_date.label("due_date"),
            Invoice.total_amount.label("invoice_total"),
            func.coalesce(paid_sub.c.paid_amount, ZERO).label("paid_amount"),
            balance_expr.label("outstanding_balance")
        )
        .outerjoin(paid_sub, Invoice.id == paid_sub.c.invoice_id)
        .filter(*base_filters)
        .order_by(Invoice.due_date.asc())
        .offset(skip)
        .limit(limit)
    )

    rows = paged_query.all()

    invoices_list = [
        {
            "invoice_id": r.invoice_id,
            "invoice_number": r.invoice_number,
            "customer_id": r.customer_id,
            "subscription_id": r.subscription_id,
            "issue_date": str(r.issue_date),
            "due_date": str(r.due_date),
            "invoice_total": str(money(r.invoice_total)),
            "paid_amount": str(money(r.paid_amount)),
            "outstanding_balance": str(money(r.outstanding_balance)),
        }
        for r in rows
    ]

    return {
        "total_overdue_amount": str(total_overdue),
        "total_overdue_invoices": total_count,
        "skip": skip,
        "limit": limit,
        "invoices": invoices_list,
    }
