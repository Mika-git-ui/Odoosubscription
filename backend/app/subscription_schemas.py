from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class SubscriptionLineCreate(BaseModel):
    product_id: int
    variant_id: int | None = None
    quantity: int = Field(ge=1)


class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    start_date: date
    expiry_date: date | None = None
    payment_terms: str = "Due on receipt"
    lines: list[SubscriptionLineCreate] = Field(min_length=1)


class SubscriptionLineResponse(BaseModel):
    id: int
    product_id: int
    variant_id: int | None
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class SubscriptionResponse(BaseModel):
    id: int
    subscription_number: str
    customer_id: int
    plan_id: int
    start_date: date
    expiry_date: date | None
    status: str
    payment_terms: str
    lines: list[SubscriptionLineResponse]

    model_config = ConfigDict(from_attributes=True)