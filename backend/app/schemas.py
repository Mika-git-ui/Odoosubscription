import re
from datetime import date
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


# CUSTOMER SCHEMAS

class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = None
    address: str | None = None


class CustomerResponse(CustomerCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


# PRODUCT SCHEMAS

class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    product_type: str
    sales_price: Decimal = Field(ge=0)
    cost_price: Decimal = Field(ge=0)
    notes: str | None = None


class ProductResponse(ProductCreate):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


# PLAN SCHEMAS

class PlanCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal = Field(ge=0)
    billing_interval: str
    minimum_quantity: int = Field(default=1, ge=1)
    available_from: date | None = None
    available_until: date | None = None
    allow_auto_close: bool = False
    allow_early_close: bool = False
    allow_pause: bool = False
    allow_renew: bool = True


class PlanResponse(PlanCreate):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


# AUTHENTICATION SCHEMAS

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=9)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain an uppercase letter")

        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain a lowercase letter")

        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError("Password must contain a special character")

        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# DISCOUNT SCHEMAS

class DiscountCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    discount_type: str
    value: Decimal = Field(gt=0)
    applicable_to: str = Field(default="subscription")
    product_id: int | None = None
    minimum_purchase: Decimal = Field(default=Decimal("0.00"), ge=0)
    minimum_quantity: int = Field(default=1, ge=1)
    start_date: date | None = None
    end_date: date | None = None
    maximum_uses: int | None = Field(default=None, ge=1)

    @field_validator("discount_type")
    @classmethod
    def validate_discount_type(cls, v: str) -> str:
        val = v.lower().strip()
        if val not in ("percentage", "fixed"):
            raise ValueError("discount_type must be 'percentage' or 'fixed'")
        return val

    @field_validator("applicable_to")
    @classmethod
    def validate_applicable_to(cls, v: str) -> str:
        val = v.lower().strip()
        if val not in ("subscription", "product"):
            raise ValueError("applicable_to must be 'subscription' or 'product'")
        return val


class DiscountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    discount_type: str | None = None
    value: Decimal | None = Field(default=None, gt=0)
    applicable_to: str | None = None
    product_id: int | None = None
    minimum_purchase: Decimal | None = Field(default=None, ge=0)
    minimum_quantity: int | None = Field(default=None, ge=1)
    start_date: date | None = None
    end_date: date | None = None
    maximum_uses: int | None = None
    is_active: bool | None = None

    @field_validator("discount_type")
    @classmethod
    def validate_discount_type(cls, v: str | None) -> str | None:
        if v is not None:
            val = v.lower().strip()
            if val not in ("percentage", "fixed"):
                raise ValueError("discount_type must be 'percentage' or 'fixed'")
            return val
        return v

    @field_validator("applicable_to")
    @classmethod
    def validate_applicable_to(cls, v: str | None) -> str | None:
        if v is not None:
            val = v.lower().strip()
            if val not in ("subscription", "product"):
                raise ValueError("applicable_to must be 'subscription' or 'product'")
            return val
        return v


class DiscountResponse(BaseModel):
    id: int
    name: str
    discount_type: str
    value: Decimal
    applicable_to: str
    product_id: int | None
    minimum_purchase: Decimal
    minimum_quantity: int
    start_date: date | None
    end_date: date | None
    maximum_uses: int | None
    current_uses: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# QUOTATION TEMPLATE SCHEMAS

class QuotationTemplateLineCreate(BaseModel):
    product_id: int
    variant_id: int | None = None
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal | None = Field(default=None, ge=0)


class QuotationTemplateCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    plan_id: int
    validity_days: int = Field(default=30, ge=1)
    lines: list[QuotationTemplateLineCreate] = Field(min_length=1)


class QuotationTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    plan_id: int | None = None
    validity_days: int | None = Field(default=None, ge=1)
    is_active: bool | None = None
    lines: list[QuotationTemplateLineCreate] | None = None


class QuotationTemplateLineResponse(BaseModel):
    id: int
    product_id: int
    variant_id: int | None
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class QuotationTemplateResponse(BaseModel):
    id: int
    name: str
    description: str | None
    plan_id: int
    validity_days: int
    is_active: bool
    total_amount: Decimal
    lines: list[QuotationTemplateLineResponse]

    model_config = ConfigDict(from_attributes=True)


# PASSWORD RESET SCHEMAS

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=10)
    new_password: str = Field(min_length=9)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError("Password must contain a special character")
        return value