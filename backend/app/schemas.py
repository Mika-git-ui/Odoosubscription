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