
import uuid
import calendar
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.entities import (
    Subscription,
    SubscriptionLine,
    Product,
    Invoice,
    InvoiceLine,
)

from app.models.entities import (
    Subscription,
    SubscriptionLine,
    Product,
    Invoice,
    InvoiceLine,
    Payment
)
from decimal import Decimal
from pydantic import BaseModel, Field
from sqlalchemy import func

router = APIRouter(prefix="/billing", tags=["Billing"])


def get_next_billing_date(current_date, interval):
    if interval == "daily":
        return current_date + timedelta(days=1)

    if interval == "weekly":
        return current_date + timedelta(weeks=1)

    if interval == "monthly":
        month = current_date.month + 1
        year = current_date.year

        if month > 12:
            month = 1
            year += 1

        day = min(
            current_date.day,
            calendar.monthrange(year, month)[1]
        )
        return date(year, month, day)

    if interval == "yearly":
        year = current_date.year + 1
        day = min(
            current_date.day,
            calendar.monthrange(year, current_date.month)[1]
        )
        return date(year, current_date.month, day)

    raise HTTPException(400, "Unsupported billing interval")


@router.post("/generate/{subscription_id}")
def generate_invoice(
    subscription_id: int,
    db: Session = Depends(get_db)
):
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()

    if not subscription:
        raise HTTPException(404, "Subscription not found")

    if subscription.status != "active" or subscription.is_paused:
        raise HTTPException(
            400,
            "Subscription is not eligible for billing"
        )

    billing_date = subscription.next_billing_date or subscription.start_date

    if billing_date > date.today():
        raise HTTPException(400, "Billing date has not arrived")

    if subscription.expiry_date and billing_date > subscription.expiry_date:
        raise HTTPException(400, "Subscription has expired")

    lines = db.query(SubscriptionLine).filter(
        SubscriptionLine.subscription_id == subscription.id
    ).all()

    if not lines:
        raise HTTPException(400, "Subscription has no products")

    next_date = get_next_billing_date(
        billing_date,
        subscription.plan.billing_interval
    )
    period_end = next_date - timedelta(days=1)

    # Check for an existing invoice before creating one.
    existing_invoice = db.query(Invoice).filter(
        Invoice.subscription_id == subscription.id,
        Invoice.billing_period_start == billing_date,
        Invoice.billing_period_end == period_end
    ).first()

    if existing_invoice:
        raise HTTPException(
            409,
            "Invoice already exists for this billing period"
        )

    try:
        invoice = Invoice(
            invoice_number=f"INV-{uuid.uuid4().hex[:10].upper()}",
            subscription_id=subscription.id,
            customer_id=subscription.customer_id,
            billing_period_start=billing_date,
            billing_period_end=period_end,
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=15),
            subtotal=Decimal("0.00"),
            tax_amount=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            total_amount=Decimal("0.00"),
            status="draft",
        )

        db.add(invoice)
        db.flush()

        subtotal = Decimal("0.00")

        for line in lines:
            product = db.query(Product).filter(
                Product.id == line.product_id
            ).first()

            if not product:
                raise HTTPException(
                    400,
                    f"Product {line.product_id} not found"
                )

            amount = line.unit_price * line.quantity
            subtotal += amount

            db.add(InvoiceLine(
                invoice_id=invoice.id,
                product_name=product.name,
                quantity=line.quantity,
                unit_price=line.unit_price,
                tax_rate=Decimal("0.00"),
                line_subtotal=amount,
                line_tax=Decimal("0.00"),
                line_total=amount,
            ))

        invoice.subtotal = subtotal
        invoice.total_amount = subtotal

        subscription.next_billing_date = next_date

        db.commit()
        db.refresh(invoice)

        return {
            "message": "Invoice generated successfully",
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "subscription_id": subscription.id,
            "billing_period_start": str(invoice.billing_period_start),
            "billing_period_end": str(invoice.billing_period_end),
            "subtotal": str(invoice.subtotal),
            "total": str(invoice.total_amount),
            "status": invoice.status,
        }

    except IntegrityError as exc:
        db.rollback()

        # Only call it a duplicate if the matching invoice exists.
        existing = db.query(Invoice).filter(
            Invoice.subscription_id == subscription_id,
            Invoice.billing_period_start == billing_date,
            Invoice.billing_period_end == period_end
        ).first()

        if existing:
            raise HTTPException(
                409,
                "Invoice already exists for this billing period"
            )

        print("INVOICE DATABASE ERROR:", str(exc.orig))
        raise HTTPException(
            500,
            "Invoice creation failed due to a database constraint"
        )

    except Exception:
        db.rollback()
        raise

@router.get("/invoices")
def list_invoices(
    db: Session = Depends(get_db)
):
    invoices = db.query(Invoice).order_by(
        Invoice.id.desc()
    ).all()

    return [
        {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "subscription_id": invoice.subscription_id,
            "customer_id": invoice.customer_id,
            "billing_period_start": str(invoice.billing_period_start),
            "billing_period_end": str(invoice.billing_period_end),
            "subtotal": str(invoice.subtotal),
            "total_amount": str(invoice.total_amount),
            "status": invoice.status
        }
        for invoice in invoices
    ]

class PaymentCreate(BaseModel):
    payment_method: str
    amount: Decimal = Field(gt=0)
    payment_date: date
    note: str | None = None


@router.post("/invoices/{invoice_id}/confirm")
def confirm_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(404, "Invoice not found")

    if invoice.status != "draft":
        raise HTTPException(400, "Only draft invoices can be confirmed")

    invoice.status = "confirmed"
    db.commit()

    return {
        "message": "Invoice confirmed successfully",
        "invoice_id": invoice.id,
        "status": invoice.status
    }


@router.post("/invoices/{invoice_id}/payments")
def record_payment(
    invoice_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).with_for_update().first()

    if not invoice:
        raise HTTPException(404, "Invoice not found")

    if invoice.status != "confirmed":
        raise HTTPException(
            400,
            "Only confirmed invoices can receive payments"
        )

    total_paid = db.query(
        func.coalesce(func.sum(Payment.amount), 0)
    ).filter(
        Payment.invoice_id == invoice_id
    ).scalar()

    outstanding = invoice.total_amount - total_paid

    if payment_data.amount > outstanding:
        raise HTTPException(
            400,
            f"Payment exceeds outstanding balance of {outstanding}"
        )

    payment = Payment(
        invoice_id=invoice.id,
        payment_method=payment_data.payment_method,
        amount=payment_data.amount,
        payment_date=payment_data.payment_date,
        note=payment_data.note
    )

    db.add(payment)

    new_paid = total_paid + payment_data.amount

    if new_paid == invoice.total_amount:
        invoice.status = "paid"

    db.commit()
    db.refresh(payment)

    return {
        "message": "Payment recorded successfully",
        "payment_id": payment.id,
        "invoice_id": invoice.id,
        "invoice_total": str(invoice.total_amount),
        "paid_amount": str(new_paid),
        "outstanding_balance": str(invoice.total_amount - new_paid),
        "invoice_status": invoice.status
    }


@router.get("/invoices/{invoice_id}/balance")
def get_invoice_balance(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(404, "Invoice not found")

    total_paid = db.query(
        func.coalesce(func.sum(Payment.amount), 0)
    ).filter(
        Payment.invoice_id == invoice_id
    ).scalar()

    return {
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "invoice_total": str(invoice.total_amount),
        "paid_amount": str(total_paid),
        "outstanding_balance": str(invoice.total_amount - total_paid),
        "status": invoice.status
    }

