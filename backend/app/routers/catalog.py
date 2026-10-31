
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import Customer, Product, Plan
from app.schemas import (
    CustomerCreate, CustomerResponse,
    ProductCreate, ProductResponse,
    PlanCreate, PlanResponse
)

router = APIRouter()


@router.post("/customers/", response_model=CustomerResponse)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    if db.query(Customer).filter(Customer.email == data.email).first():
        raise HTTPException(status_code=409, detail="Customer email already exists")

    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/customers/", response_model=list[CustomerResponse])
def list_customers(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Customer).offset(skip).limit(min(limit, 100)).all()


@router.post("/products/", response_model=ProductResponse)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products/", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.is_active == True).all()


@router.post("/plans/", response_model=PlanResponse)
def create_plan(data: PlanCreate, db: Session = Depends(get_db)):
    allowed = {"daily", "weekly", "monthly", "yearly"}

    if data.billing_interval not in allowed:
        raise HTTPException(status_code=400, detail="Invalid billing interval")

    if data.available_from and data.available_until:
        if data.available_until < data.available_from:
            raise HTTPException(status_code=400, detail="Invalid availability dates")

    plan = Plan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/plans/", response_model=list[PlanResponse])
def list_plans(db: Session = Depends(get_db)):
    return db.query(Plan).filter(Plan.is_active == True).all()
