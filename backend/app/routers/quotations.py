from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.entities import (
    QuotationTemplate,
    QuotationTemplateLine,
    Plan,
    Product,
    ProductVariant,
)
from app.schemas import (
    QuotationTemplateCreate,
    QuotationTemplateUpdate,
    QuotationTemplateResponse,
    QuotationTemplateLineResponse,
)
from app.routers.auth import get_current_user, require_roles

router = APIRouter(prefix="/quotation-templates", tags=["Quotation Templates"])

CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def money(value):
    return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)


def get_template_or_404(template_id: int, db: Session) -> QuotationTemplate:
    template = db.query(QuotationTemplate).filter(
        QuotationTemplate.id == template_id
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation template not found"
        )
    return template


def build_template_response(template: QuotationTemplate) -> QuotationTemplateResponse:
    total = sum((money(line.line_total) for line in template.lines), ZERO)
    line_responses = [
        QuotationTemplateLineResponse(
            id=line.id,
            product_id=line.product_id,
            variant_id=line.variant_id,
            quantity=line.quantity,
            unit_price=money(line.unit_price),
            line_total=money(line.line_total)
        )
        for line in template.lines
    ]
    return QuotationTemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        plan_id=template.plan_id,
        validity_days=template.validity_days,
        is_active=template.is_active,
        total_amount=total,
        lines=line_responses
    )


def process_lines(lines_data, plan, db: Session):
    total_qty = sum(item.quantity for item in lines_data)
    if total_qty < (plan.minimum_quantity or 1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total quantity ({total_qty}) is less than plan minimum quantity ({plan.minimum_quantity})"
        )

    processed = []
    for item in lines_data:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_active.is_(True)
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Active product with id {item.product_id} not found"
            )

        unit_price = item.unit_price
        if unit_price is None:
            unit_price = money(product.sales_price)
            if item.variant_id is not None:
                variant = db.query(ProductVariant).filter(
                    ProductVariant.id == item.variant_id,
                    ProductVariant.product_id == product.id
                ).first()
                if not variant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Variant {item.variant_id} not found for product {product.id}"
                    )
                unit_price = money(unit_price + money(variant.price_adjustment))
        else:
            unit_price = money(unit_price)
            if item.variant_id is not None:
                variant = db.query(ProductVariant).filter(
                    ProductVariant.id == item.variant_id,
                    ProductVariant.product_id == product.id
                ).first()
                if not variant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Variant {item.variant_id} not found for product {product.id}"
                    )

        if unit_price < ZERO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unit price cannot be negative"
            )

        line_total = money(unit_price * item.quantity)
        processed.append({
            "product_id": product.id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "line_total": line_total
        })

    return processed


@router.post("/", response_model=QuotationTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_quotation_template(
    data: QuotationTemplateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    plan = db.query(Plan).filter(
        Plan.id == data.plan_id,
        Plan.is_active.is_(True)
    ).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active plan not found"
        )

    processed_lines = process_lines(data.lines, plan, db)

    try:
        template = QuotationTemplate(
            name=data.name,
            description=data.description,
            plan_id=data.plan_id,
            validity_days=data.validity_days,
            is_active=True
        )
        db.add(template)
        db.flush()

        for line_info in processed_lines:
            line = QuotationTemplateLine(
                template_id=template.id,
                product_id=line_info["product_id"],
                variant_id=line_info["variant_id"],
                quantity=line_info["quantity"],
                unit_price=line_info["unit_price"],
                line_total=line_info["line_total"]
            )
            db.add(line)

        db.commit()
        db.refresh(template)
        return build_template_response(template)
    except Exception:
        db.rollback()
        raise


@router.get("/", response_model=list[QuotationTemplateResponse])
def list_quotation_templates(
    is_active: bool | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    query = db.query(QuotationTemplate)
    if is_active is not None:
        query = query.filter(QuotationTemplate.is_active == is_active)

    templates = query.order_by(QuotationTemplate.id.desc()).offset(skip).limit(limit).all()
    return [build_template_response(t) for t in templates]


@router.get("/{template_id}", response_model=QuotationTemplateResponse)
def get_quotation_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    template = get_template_or_404(template_id, db)
    return build_template_response(template)


@router.put("/{template_id}", response_model=QuotationTemplateResponse)
def update_quotation_template(
    template_id: int,
    data: QuotationTemplateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    template = get_template_or_404(template_id, db)

    plan = db.query(Plan).filter(
        Plan.id == data.plan_id,
        Plan.is_active.is_(True)
    ).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active plan not found"
        )

    processed_lines = process_lines(data.lines, plan, db)

    try:
        template.name = data.name
        template.description = data.description
        template.plan_id = data.plan_id
        template.validity_days = data.validity_days

        # Remove existing lines and add new lines
        db.query(QuotationTemplateLine).filter(
            QuotationTemplateLine.template_id == template.id
        ).delete()

        for line_info in processed_lines:
            line = QuotationTemplateLine(
                template_id=template.id,
                product_id=line_info["product_id"],
                variant_id=line_info["variant_id"],
                quantity=line_info["quantity"],
                unit_price=line_info["unit_price"],
                line_total=line_info["line_total"]
            )
            db.add(line)

        db.commit()
        db.refresh(template)
        return build_template_response(template)
    except Exception:
        db.rollback()
        raise


@router.patch("/{template_id}", response_model=QuotationTemplateResponse)
def patch_quotation_template(
    template_id: int,
    data: QuotationTemplateUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    template = get_template_or_404(template_id, db)

    plan_id = data.plan_id if data.plan_id is not None else template.plan_id
    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.is_active.is_(True)
    ).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active plan not found"
        )

    try:
        if data.name is not None:
            template.name = data.name
        if data.description is not None:
            template.description = data.description
        if data.plan_id is not None:
            template.plan_id = data.plan_id
        if data.validity_days is not None:
            template.validity_days = data.validity_days
        if data.is_active is not None:
            template.is_active = data.is_active

        if data.lines is not None:
            processed_lines = process_lines(data.lines, plan, db)
            db.query(QuotationTemplateLine).filter(
                QuotationTemplateLine.template_id == template.id
            ).delete()

            for line_info in processed_lines:
                line = QuotationTemplateLine(
                    template_id=template.id,
                    product_id=line_info["product_id"],
                    variant_id=line_info["variant_id"],
                    quantity=line_info["quantity"],
                    unit_price=line_info["unit_price"],
                    line_total=line_info["line_total"]
                )
                db.add(line)

        db.commit()
        db.refresh(template)
        return build_template_response(template)
    except Exception:
        db.rollback()
        raise


@router.patch("/{template_id}/deactivate", response_model=QuotationTemplateResponse)
def deactivate_quotation_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    template = get_template_or_404(template_id, db)
    template.is_active = False
    db.commit()
    db.refresh(template)
    return build_template_response(template)


@router.delete("/{template_id}")
def delete_quotation_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "staff"))
):
    template = get_template_or_404(template_id, db)
    template.is_active = False
    db.commit()
    return {"message": "Quotation template deactivated successfully", "id": template.id}
