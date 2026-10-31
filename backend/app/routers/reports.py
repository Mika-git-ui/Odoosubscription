
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import (
    Subscription,
    Invoice,
    Payment,
)
from app.routers.auth import require_roles


router = APIRouter(prefix="/reports", tags=["Reports"])


def money(value):
    return Decimal(str(value or 0)).quantize(Decimal("0.01"))


def get_invoice_payment_query(db, date_from=None, date_to=None):
    paid_subquery = (
        db.query(
            Payment.invoice_id.label("invoice_id"),
            func.sum(Payment.amount).label("paid_amount")
        )
        .group_by(Payment.invoice_id)
        .subquery()
    )

    query = (
        db.query(
            Invoice,
            func.coalesce(
                paid_subquery.c.paid_amount, 0
            ).label("paid_amount")
        )
        .outerjoin(
            paid_subquery,
            Invoice.id == paid_subquery.c.invoice_id
        )
        .filter(Invoice.status == "confirmed")
    )

    if date_from:
        query = query.filter(Invoice.issue_date >= date_from)

    if date_to:
        query = query.filter(Invoice.issue_date <= date_to)

    return query


# REPORT SUMMARY

@router.get("/summary")
def report_summary(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    if date_from and date_to and date_from > date_to:
        from fastapi import HTTPException
        raise HTTPException(400, "Start date cannot be after end date")

    active_subscriptions = db.query(
        func.count(Subscription.id)
    ).filter(
        Subscription.status == "active"
    ).scalar() or 0

    # Revenue is based on actual payments received.
    payment_query = db.query(
        func.coalesce(func.sum(Payment.amount), 0)
    )

    if date_from:
        payment_query = payment_query.filter(
            Payment.payment_date >= date_from
        )

    if date_to:
        payment_query = payment_query.filter(
            Payment.payment_date <= date_to
        )

    revenue_received = money(payment_query.scalar())

    # Outstanding and overdue balances.
    invoice_query = get_invoice_payment_query(
        db, date_from, date_to
    )

    outstanding_amount = Decimal("0.00")
    overdue_amount = Decimal("0.00")
    overdue_count = 0
    outstanding_count = 0

    today = date.today()

    for invoice, paid_amount in invoice_query.all():
        balance = money(invoice.total_amount - paid_amount)

        if balance <= 0:
            continue

        outstanding_amount += balance
        outstanding_count += 1

        if invoice.due_date and invoice.due_date < today:
            overdue_amount += balance
            overdue_count += 1

    return {
        "active_subscriptions": active_subscriptions,
        "revenue_received": str(money(revenue_received)),
        "outstanding_amount": str(money(outstanding_amount)),
        "outstanding_invoice_count": outstanding_count,
        "overdue_amount": str(money(overdue_amount)),
        "overdue_invoice_count": overdue_count,
        "date_from": str(date_from) if date_from else None,
        "date_to": str(date_to) if date_to else None,
    }


# OVERDUE INVOICE REPORT

@router.get("/overdue-invoices")
def overdue_invoices(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    if date_from and date_to and date_from > date_to:
        from fastapi import HTTPException
        raise HTTPException(400, "Start date cannot be after end date")

    query = get_invoice_payment_query(db, date_from, date_to)

    query = query.filter(
        Invoice.due_date < date.today()
    ).order_by(Invoice.due_date.asc())

    results = []
    total_overdue = Decimal("0.00")

    for invoice, paid_amount in query.all():
        balance = money(invoice.total_amount - paid_amount)

        if balance <= 0:
            continue

        total_overdue += balance

        results.append({
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "customer_id": invoice.customer_id,
            "subscription_id": invoice.subscription_id,
            "issue_date": str(invoice.issue_date),
            "due_date": str(invoice.due_date),
            "invoice_total": str(money(invoice.total_amount)),
            "paid_amount": str(money(paid_amount)),
            "outstanding_balance": str(balance),
        })

    return {
        "total_overdue_amount": str(money(total_overdue)),
        "total_overdue_invoices": len(results),
        "skip": skip,
        "limit": limit,
        "invoices": results[skip:skip + limit],
    }
