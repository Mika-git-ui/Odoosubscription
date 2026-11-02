from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import Discount, Product
from app.schemas import DiscountCreate, DiscountUpdate, DiscountResponse
from app.routers.auth import require_roles

router = APIRouter(prefix="/discounts", tags=["Discounts"])


def get_discount_or_404(discount_id: int, db: Session) -> Discount:
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not discount:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discount not found"
        )
    return discount


def validate_discount_data(
    data: DiscountCreate | DiscountUpdate,
    db: Session,
    current_discount: Discount | None = None
):
    # Determine effective values
    dtype = data.discount_type if data.discount_type is not None else (current_discount.discount_type if current_discount else None)
    val = data.value if data.value is not None else (current_discount.value if current_discount else None)
    app_to = data.applicable_to if data.applicable_to is not None else (current_discount.applicable_to if current_discount else "subscription")
    pid = data.product_id if getattr(data, "product_id", None) is not None else (current_discount.product_id if current_discount else None)
    sdate = data.start_date if data.start_date is not None else (current_discount.start_date if current_discount else None)
    edate = data.end_date if data.end_date is not None else (current_discount.end_date if current_discount else None)

    if dtype == "percentage" and val is not None and val > Decimal("100"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Percentage discount cannot exceed 100%"
        )

    if app_to == "product":
        if not pid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="product_id is required for product-specific discounts"
            )
        prod = db.query(Product).filter(Product.id == pid).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {pid} not found"
            )

    if sdate and edate and edate < sdate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be earlier than start date"
        )


@router.post("/", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(
    data: DiscountCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin"))
):
    validate_discount_data(data, db)

    discount = Discount(
        name=data.name,
        discount_type=data.discount_type,
        value=data.value,
        applicable_to=data.applicable_to,
        product_id=data.product_id if data.applicable_to == "product" else None,
        minimum_purchase=data.minimum_purchase,
        minimum_quantity=data.minimum_quantity,
        start_date=data.start_date,
        end_date=data.end_date,
        maximum_uses=data.maximum_uses,
        current_uses=0,
        is_active=True
    )

    db.add(discount)
    db.commit()
    db.refresh(discount)
    return discount


@router.get("/", response_model=list[DiscountResponse])
def list_discounts(
    is_active: bool | None = Query(default=None),
    applicable_to: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin"))
):
    query = db.query(Discount)
    if is_active is not None:
        query = query.filter(Discount.is_active == is_active)
    if applicable_to:
        query = query.filter(Discount.applicable_to == applicable_to)

    return query.order_by(Discount.id.desc()).offset(skip).limit(limit).all()


@router.get("/{discount_id}", response_model=DiscountResponse)
def get_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin"))
):
    return get_discount_or_404(discount_id, db)


@router.put("/{discount_id}", response_model=DiscountResponse)
def update_discount(
    discount_id: int,
    data: DiscountCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin"))
):
    discount = get_discount_or_404(discount_id, db)
    validate_discount_data(data, db, discount)

    discount.name = data.name
    discount.discount_type = data.discount_type
    discount.value = data.value
    discount.applicable_to = data.applicable_to
    discount.product_id = data.product_id if data.applicable_to == "product" else None
    discount.minimum_purchase = data.minimum_purchase
    discount.minimum_quantity = data.minimum_quantity
    discount.start_date = data.start_date
    discount.end_date = data.end_date
    discount.maximum_uses = data.maximum_uses

    db.commit()
    db.refresh(discount)
    return discount


@router.patch("/{discount_id}", response_model=DiscountResponse)
def patch_discount(
    discount_id: int,
    data: DiscountUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin"))
):
    discount = get_discount_or_404(discount_id, db)
    validate_discount_data(data, db, discount)

    update_data = data.model_dump(exclude_unset=True)
    if "applicable_to" in update_data and update_data["applicable_to"] == "subscription":
        discount.product_id = None
        update_data.pop("product_id", None)

    for field, val in update_data.items():
        setattr(discount, field, val)

    db.commit()
    db.refresh(discount)
    return discount


@router.patch("/{discount_id}/deactivate", response_model=DiscountResponse)
def deactivate_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin"))
):
    discount = get_discount_or_404(discount_id, db)
    discount.is_active = False
    db.commit()
    db.refresh(discount)
    return discount


@router.delete("/{discount_id}")
def delete_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin"))
):
    discount = get_discount_or_404(discount_id, db)
    discount.is_active = False
    db.commit()
    return {"message": "Discount deactivated successfully", "id": discount.id}
