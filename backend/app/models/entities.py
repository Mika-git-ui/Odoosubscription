
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime,
    ForeignKey, Numeric, Text, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="customer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer", back_populates="user", uselist=False)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(30))
    address = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="customer")
    subscriptions = relationship("Subscription", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    product_type = Column(String(50), nullable=False)
    sales_price = Column(Numeric(12, 2), nullable=False)
    cost_price = Column(Numeric(12, 2), nullable=False, default=0)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)

    variants = relationship("ProductVariant", back_populates="product")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)
    value = Column(String(150), nullable=False)
    price_adjustment = Column(Numeric(12, 2), default=0)

    product = relationship("Product", back_populates="variants")


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    price = Column(Numeric(12, 2), nullable=False)
    billing_interval = Column(String(20), nullable=False)
    minimum_quantity = Column(Integer, default=1)
    available_from = Column(Date)
    available_until = Column(Date)
    allow_auto_close = Column(Boolean, default=False)
    allow_early_close = Column(Boolean, default=False)
    allow_pause = Column(Boolean, default=False)
    allow_renew = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_number = Column(String(50), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date)
    next_billing_date = Column(Date)
    status = Column(String(20), nullable=False, default="draft")
    payment_terms = Column(String(100))
    is_paused = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    lines = relationship(
        "SubscriptionLine",
        back_populates="subscription",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_subscription_status_billing", "status", "next_billing_date"),
    )


class SubscriptionLine(Base):
    __tablename__ = "subscription_lines"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(
        Integer, ForeignKey("subscriptions.id"), nullable=False
    )
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"))
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    line_total = Column(Numeric(12, 2), nullable=False)

    subscription = relationship("Subscription", back_populates="lines")

class TaxRule(Base):
    __tablename__ = "tax_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rate = Column(Numeric(5, 2), nullable=False)
    is_active = Column(Boolean, default=True)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(12, 2), nullable=False, default=0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(String(20), nullable=False, default="draft")
    created_at = Column(DateTime, server_default=func.now())

    lines = relationship(
        "InvoiceLine",
        back_populates="invoice",
        cascade="all, delete-orphan"
    )
    payments = relationship("Payment", back_populates="invoice")

    __table_args__ = (
        Index(
            "uq_invoice_subscription_period",
            "subscription_id",
            "billing_period_start",
            "billing_period_end",
            unique=True
        ),
    )


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    product_name = Column(String(150), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0)
    line_subtotal = Column(Numeric(12, 2), nullable=False)
    line_tax = Column(Numeric(12, 2), nullable=False, default=0)
    line_total = Column(Numeric(12, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="lines")


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    discount_type = Column(String(20), nullable=False)
    value = Column(Numeric(12, 2), nullable=False)
    applicable_to = Column(String(20), nullable=False, default="subscription")
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    minimum_purchase = Column(Numeric(12, 2), default=0)
    minimum_quantity = Column(Integer, default=1)
    start_date = Column(Date)
    end_date = Column(Date)
    maximum_uses = Column(Integer)
    current_uses = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    product = relationship("Product")


class DiscountUsage(Base):
    __tablename__ = "discount_usages"

    id = Column(Integer, primary_key=True, index=True)
    discount_id = Column(Integer, ForeignKey("discounts.id"), nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    amount_saved = Column(Numeric(12, 2), nullable=False)
    used_at = Column(DateTime, server_default=func.now())


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    payment_method = Column(String(50), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    note = Column(Text)

    invoice = relationship("Invoice", back_populates="payments")


class QuotationTemplate(Base):
    __tablename__ = "quotation_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    validity_days = Column(Integer, nullable=False, default=30)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    plan = relationship("Plan")
    lines = relationship(
        "QuotationTemplateLine",
        back_populates="template",
        cascade="all, delete-orphan"
    )


class QuotationTemplateLine(Base):
    __tablename__ = "quotation_template_lines"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(
        Integer, ForeignKey("quotation_templates.id"), nullable=False
    )
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"))
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    line_total = Column(Numeric(12, 2), nullable=False)

    template = relationship("QuotationTemplate", back_populates="lines")
    product = relationship("Product")
    variant = relationship("ProductVariant")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")

