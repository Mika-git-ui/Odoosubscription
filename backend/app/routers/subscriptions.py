import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import (
    Customer,
    Plan,
    Product,
    ProductVariant,
    Subscription,
    SubscriptionLine,
)
from app.subscription_schemas import (
    SubscriptionCreate,
    SubscriptionResponse,
)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.post("/", response_model=SubscriptionResponse)
def create_subscription(
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(
        Customer.id == data.customer_id
    ).first()

    if not customer:
        raise HTTPException(404, "Customer not found")

    plan = db.query(Plan).filter(
        Plan.id == data.plan_id
    ).first()

    if not plan or not plan.is_active:
        raise HTTPException(404, "Active plan not found")

    if plan.available_from and data.start_date < plan.available_from:
        raise HTTPException(400, "Plan is not available on this date")

    if plan.available_until and data.start_date > plan.available_until:
        raise HTTPException(400, "Plan availability has expired")

    if data.expiry_date and data.expiry_date < data.start_date:
        raise HTTPException(400, "Expiry date cannot be before start date")

    total_quantity = sum(line.quantity for line in data.lines)

    if total_quantity < plan.minimum_quantity:
        raise HTTPException(
            400,
            f"Minimum quantity for this plan is {plan.minimum_quantity}"
        )

    subscription = Subscription(
        subscription_number=f"SUB-{uuid.uuid4().hex[:10].upper()}",
        customer_id=data.customer_id,
        plan_id=data.plan_id,
        start_date=data.start_date,
        expiry_date=data.expiry_date,
        next_billing_date=data.start_date,
        payment_terms=data.payment_terms,
        status="draft",
    )

    db.add(subscription)

    try:
        db.flush()

        for item in data.lines:
            product = db.query(Product).filter(
                Product.id == item.product_id,
                Product.is_active == True,
            ).first()

            if not product:
                raise HTTPException(
                    404,
                    f"Active product {item.product_id} not found"
                )

            unit_price = product.sales_price

            if item.variant_id is not None:
                variant = db.query(ProductVariant).filter(
                    ProductVariant.id == item.variant_id,
                    ProductVariant.product_id == product.id,
                ).first()

                if not variant:
                    raise HTTPException(404, "Product variant not found")

                unit_price += variant.price_adjustment

            if unit_price < 0:
                raise HTTPException(
                    400,
                    "Final product price cannot be negative"
                )

            line = SubscriptionLine(
                subscription_id=subscription.id,
                product_id=product.id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                unit_price=unit_price,
                line_total=unit_price * item.quantity,
            )

            db.add(line)

        db.commit()
        db.refresh(subscription)

        return subscription

    except Exception:
        db.rollback()
        raise


@router.get("/", response_model=list[SubscriptionResponse])
def list_subscriptions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    return (
        db.query(Subscription)
        .order_by(Subscription.id.desc())
        .offset(skip)
        .limit(min(limit, 100))
        .all()
    )


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
):
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()

    if not subscription:
        raise HTTPException(404, "Subscription not found")

    return subscription