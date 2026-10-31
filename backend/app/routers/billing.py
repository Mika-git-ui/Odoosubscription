
import uuid
import calendar

from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.entities import (
    Customer,
    Subscription,
    SubscriptionLine,
    Product,
    Invoice,
    InvoiceLine,
    Payment,
    TaxRule,
    Discount,
    DiscountUsage,
)
from app.routers.auth import get_current_user, require_roles


router = APIRouter(prefix="/billing", tags=["Billing"])

CENT = Decimal("0.01")
ZERO = Decimal("0.00")


# HELPERS

def money(value):
    return Decimal(str(value or 0)).quantize(
        CENT,
        rounding=ROUND_HALF_UP
    )


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

        day = min(current_date.day, calendar.monthrange(year, month)[1])
        return date(year, month, day)

    if interval == "yearly":
        year = current_date.year + 1
        day = min(
            current_date.day,
            calendar.monthrange(year, current_date.month)[1]
        )
        return date(year, current_date.month, day)

    raise HTTPException(400, "Unsupported billing interval")


def get_invoice_or_404(invoice_id, db):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(404, "Invoice not found")

    return invoice


def ensure_invoice_access(invoice, current_user, db):
    if current_user.role in ("admin", "staff"):
        return

    if current_user.role == "customer":
        customer = db.query(Customer).filter(
            Customer.user_id == current_user.id
        ).first()

        if not customer or invoice.customer_id != customer.id:
            raise HTTPException(403, "You cannot access this invoice")

        return

    raise HTTPException(403, "Access denied")


def get_total_paid(invoice_id, db):
    result = db.query(
        func.coalesce(func.sum(Payment.amount), 0)
    ).filter(
        Payment.invoice_id == invoice_id
    ).scalar()

    return money(result)


def calculate_discount(subtotal, total_quantity, db):
    """
    Returns the first eligible discount and its amount.
    Only one discount is applied per invoice.
    """

    discounts = db.query(Discount).filter(
        Discount.is_active == True
    ).order_by(Discount.id.asc()).all()

    today = date.today()

    for discount in discounts:

        if discount.start_date and today < discount.start_date:
            continue

        if discount.end_date and today > discount.end_date:
            continue

        if subtotal < money(discount.minimum_purchase):
            continue

        if total_quantity < (discount.minimum_quantity or 1):
            continue

        if (
            discount.maximum_uses is not None
            and (discount.current_uses or 0) >= discount.maximum_uses
        ):
            continue

        discount_type = discount.discount_type.lower()

        if discount_type == "percentage":
            amount = subtotal * money(discount.value) / Decimal("100")

        elif discount_type == "fixed":
            amount = money(discount.value)

        else:
            continue

        amount = min(money(amount), subtotal)

        if amount > ZERO:
            return discount, amount

    return None, ZERO


# GENERATE INVOICE: ADMIN AND STAFF

@router.post("/generate/{subscription_id}")
def generate_invoice(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).with_for_update().first()

    if not subscription:
        raise HTTPException(404, "Subscription not found")

    if subscription.status != "active" or subscription.is_paused:
        raise HTTPException(400, "Subscription is not eligible for billing")

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
            subtotal=ZERO,
            tax_amount=ZERO,
            discount_amount=ZERO,
            total_amount=ZERO,
            status="draft",
        )

        db.add(invoice)
        db.flush()

        # Calculate subtotal and quantity.
        subtotal = ZERO
        total_quantity = 0
        invoice_items = []

        for line in lines:
            product = db.query(Product).filter(
                Product.id == line.product_id
            ).first()

            if not product:
                raise HTTPException(
                    400,
                    f"Product {line.product_id} not found"
                )

            amount = money(line.unit_price * line.quantity)

            subtotal += amount
            total_quantity += line.quantity

            invoice_items.append({
                "product_name": product.name,
                "quantity": line.quantity,
                "unit_price": money(line.unit_price),
                "subtotal": amount,
            })

        subtotal = money(subtotal)

        # Combine all active tax rates.
        tax_rules = db.query(TaxRule).filter(
            TaxRule.is_active == True
        ).all()

        combined_tax_rate = sum(
            (Decimal(str(rule.rate)) for rule in tax_rules),
            ZERO
        )

        # Find one eligible discount.
        discount, discount_amount = calculate_discount(
            subtotal,
            total_quantity,
            db
        )

        taxable_subtotal = money(subtotal - discount_amount)

        # Distribute the discount proportionally across invoice lines.
        total_tax = ZERO
        total_discount_distributed = ZERO

        for index, item in enumerate(invoice_items):

            if index == len(invoice_items) - 1:
                line_discount = money(
                    discount_amount - total_discount_distributed
                )
            elif subtotal > ZERO:
                line_discount = money(
                    discount_amount * item["subtotal"] / subtotal
                )
                total_discount_distributed += line_discount
            else:
                line_discount = ZERO

            taxable_line_amount = money(
                item["subtotal"] - line_discount
            )

            line_tax = money(
                taxable_line_amount
                * combined_tax_rate
                / Decimal("100")
            )

            line_total = money(taxable_line_amount + line_tax)

            total_tax += line_tax

            db.add(InvoiceLine(
                invoice_id=invoice.id,
                product_name=item["product_name"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                tax_rate=combined_tax_rate,
                line_subtotal=item["subtotal"],
                line_tax=line_tax,
                line_total=line_total,
            ))

        total_tax = money(total_tax)
        total_amount = money(taxable_subtotal + total_tax)

        invoice.subtotal = subtotal
        invoice.tax_amount = total_tax
        invoice.discount_amount = discount_amount
        invoice.total_amount = total_amount

        # Record discount usage only when a discount was applied.
        if discount:
            db.add(DiscountUsage(
                discount_id=discount.id,
                invoice_id=invoice.id,
                amount_saved=discount_amount,
            ))

            discount.current_uses = (discount.current_uses or 0) + 1

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
            "tax_rate": str(combined_tax_rate),
            "tax_amount": str(invoice.tax_amount),
            "discount_amount": str(invoice.discount_amount),
            "total": str(invoice.total_amount),
            "discount_applied": discount.name if discount else None,
            "status": invoice.status,
        }

    except IntegrityError as exc:
        db.rollback()

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
        raise HTTPException(500, "Invoice creation failed")

    except Exception:
        db.rollback()
        raise


# LIST INVOICES

@router.get("/invoices")
def list_invoices(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Invoice)

    if current_user.role == "customer":
        customer = db.query(Customer).filter(
            Customer.user_id == current_user.id
        ).first()

        if not customer:
            return []

        query = query.filter(Invoice.customer_id == customer.id)

    elif current_user.role not in ("admin", "staff"):
        raise HTTPException(403, "Access denied")

    invoices = query.order_by(Invoice.id.desc()).all()

    return [
        {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "subscription_id": invoice.subscription_id,
            "customer_id": invoice.customer_id,
            "billing_period_start": str(invoice.billing_period_start),
            "billing_period_end": str(invoice.billing_period_end),
            "subtotal": str(invoice.subtotal),
            "tax_amount": str(invoice.tax_amount),
            "discount_amount": str(invoice.discount_amount),
            "total_amount": str(invoice.total_amount),
            "status": invoice.status,
        }
        for invoice in invoices
    ]


# PAYMENT SCHEMA

class PaymentCreate(BaseModel):
    payment_method: str
    amount: Decimal = Field(gt=0)
    payment_date: date
    note: str | None = None


# CONFIRM INVOICE

@router.post("/invoices/{invoice_id}/confirm")
def confirm_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    invoice = get_invoice_or_404(invoice_id, db)

    if invoice.status != "draft":
        raise HTTPException(400, "Only draft invoices can be confirmed")

    invoice.status = "confirmed"
    db.commit()

    return {
        "message": "Invoice confirmed successfully",
        "invoice_id": invoice.id,
        "status": invoice.status
    }


# RECORD PAYMENT

@router.post("/invoices/{invoice_id}/payments")
def record_payment(
    invoice_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
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

    total_paid = get_total_paid(invoice_id, db)
    outstanding = money(invoice.total_amount - total_paid)
    payment_amount = money(payment_data.amount)

    if payment_amount > outstanding:
        raise HTTPException(
            400,
            f"Payment exceeds outstanding balance of {outstanding}"
        )

    payment = Payment(
        invoice_id=invoice.id,
        payment_method=payment_data.payment_method,
        amount=payment_amount,
        payment_date=payment_data.payment_date,
        note=payment_data.note
    )

    db.add(payment)

    new_paid = money(total_paid + payment_amount)

    if new_paid == money(invoice.total_amount):
        invoice.status = "paid"

    db.commit()
    db.refresh(payment)

    return {
        "message": "Payment recorded successfully",
        "payment_id": payment.id,
        "invoice_id": invoice.id,
        "invoice_total": str(invoice.total_amount),
        "paid_amount": str(new_paid),
        "outstanding_balance": str(
            money(invoice.total_amount - new_paid)
        ),
        "invoice_status": invoice.status
    }


# VIEW INVOICE BALANCE

@router.get("/invoices/{invoice_id}/balance")
def get_invoice_balance(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    invoice = get_invoice_or_404(invoice_id, db)
    ensure_invoice_access(invoice, current_user, db)

    total_paid = get_total_paid(invoice_id, db)

    return {
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "invoice_total": str(invoice.total_amount),
        "paid_amount": str(total_paid),
        "outstanding_balance": str(
            money(invoice.total_amount - total_paid)
        ),
        "status": invoice.status
    }


# CANCEL UNPAID INVOICE

@router.patch("/invoices/{invoice_id}/cancel")
def cancel_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    invoice = get_invoice_or_404(invoice_id, db)

    if invoice.status not in ("draft", "confirmed"):
        raise HTTPException(
            400,
            "Only draft or confirmed invoices can be cancelled"
        )

    total_paid = get_total_paid(invoice_id, db)

    if total_paid > ZERO:
        raise HTTPException(
            400,
            "An invoice with recorded payments cannot be cancelled"
        )

    invoice.status = "cancelled"
    db.commit()

    return {
        "message": "Invoice cancelled successfully",
        "invoice_id": invoice.id,
        "status": invoice.status
    }
