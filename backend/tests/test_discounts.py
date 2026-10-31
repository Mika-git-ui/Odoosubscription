import uuid
from datetime import date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import Discount, Product, Plan, Customer, Subscription, SubscriptionLine, TaxRule


def test_discount_crud_and_permissions(client: TestClient, admin_headers, staff_headers, customer_headers):
    # 1. Staff and customer cannot create discount
    res = client.post("/discounts/", json={
        "name": "Staff Discount",
        "discount_type": "percentage",
        "value": 15.0,
        "applicable_to": "subscription"
    }, headers=staff_headers)
    assert res.status_code == 403

    res = client.post("/discounts/", json={
        "name": "Customer Discount",
        "discount_type": "percentage",
        "value": 15.0,
        "applicable_to": "subscription"
    }, headers=customer_headers)
    assert res.status_code == 403

    # 2. Validation: Percentage > 100
    res = client.post("/discounts/", json={
        "name": "Invalid Percentage",
        "discount_type": "percentage",
        "value": 150.0,
        "applicable_to": "subscription"
    }, headers=admin_headers)
    assert res.status_code == 400
    assert "Percentage discount cannot exceed 100%" in res.text

    # 3. Validation: End date < start date
    res = client.post("/discounts/", json={
        "name": "Invalid Dates",
        "discount_type": "fixed",
        "value": 20.0,
        "applicable_to": "subscription",
        "start_date": "2026-05-10",
        "end_date": "2026-05-01"
    }, headers=admin_headers)
    assert res.status_code == 400
    assert "End date cannot be earlier than start date" in res.text

    # 4. Validation: Product-specific without product_id
    res = client.post("/discounts/", json={
        "name": "Missing Product ID",
        "discount_type": "percentage",
        "value": 10.0,
        "applicable_to": "product"
    }, headers=admin_headers)
    assert res.status_code == 400
    assert "product_id is required" in res.text

    # 5. Admin creates valid subscription-wide discount
    res = client.post("/discounts/", json={
        "name": f"Promo_{uuid.uuid4().hex[:6]}",
        "discount_type": "fixed",
        "value": 25.0,
        "applicable_to": "subscription",
        "minimum_purchase": 50.0,
        "maximum_uses": 10
    }, headers=admin_headers)
    assert res.status_code == 201
    disc_data = res.json()
    disc_id = disc_data["id"]
    assert disc_data["value"] == "25.00"
    assert disc_data["is_active"] is True

    # 6. Admin retrieves discount
    res = client.get(f"/discounts/{disc_id}", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["name"] == disc_data["name"]

    # 7. Admin updates discount (PUT)
    res = client.put(f"/discounts/{disc_id}", json={
        "name": "Updated Promo",
        "discount_type": "percentage",
        "value": 20.0,
        "applicable_to": "subscription",
        "minimum_purchase": 40.0,
        "maximum_uses": 5
    }, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["value"] == "20.00"
    assert res.json()["discount_type"] == "percentage"

    # 8. Admin partially updates discount (PATCH)
    res = client.patch(f"/discounts/{disc_id}", json={
        "value": 30.0
    }, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["value"] == "30.00"

    # 9. Admin deactivates discount
    res = client.patch(f"/discounts/{disc_id}/deactivate", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    # 10. Admin deletes discount (soft-delete / deactivate)
    res = client.delete(f"/discounts/{disc_id}", headers=admin_headers)
    assert res.status_code == 200


def test_product_specific_and_subscription_wide_discount_application(client: TestClient, db: Session, admin_headers):
    # Setup Products
    p1 = Product(name=f"Widget A {uuid.uuid4().hex[:4]}", product_type="service", sales_price=Decimal("100.00"), cost_price=Decimal("20.00"), is_active=True)
    p2 = Product(name=f"Widget B {uuid.uuid4().hex[:4]}", product_type="service", sales_price=Decimal("50.00"), cost_price=Decimal("10.00"), is_active=True)
    db.add_all([p1, p2])
    db.flush()

    # Setup Plan
    plan = Plan(name=f"Billing Plan {uuid.uuid4().hex[:4]}", price=Decimal("150.00"), billing_interval="monthly", is_active=True)
    db.add(plan)
    db.flush()

    # Setup Customer
    cust = db.query(Customer).first()

    # Setup Subscription with two products: 1 x Widget A ($100), 2 x Widget B ($100) -> Subtotal = $200
    sub = Subscription(
        subscription_number=f"SUB-DISC-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan.id,
        start_date=date.today(),
        next_billing_date=date.today(),
        status="active"
    )
    db.add(sub)
    db.flush()

    line1 = SubscriptionLine(subscription_id=sub.id, product_id=p1.id, quantity=1, unit_price=Decimal("100.00"), line_total=Decimal("100.00"))
    line2 = SubscriptionLine(subscription_id=sub.id, product_id=p2.id, quantity=2, unit_price=Decimal("50.00"), line_total=Decimal("100.00"))
    db.add_all([line1, line2])
    db.commit()

    # Create product-specific discount on Widget A: 20% off
    prod_disc = Discount(
        name=f"Widget A 20% Off {uuid.uuid4().hex[:4]}",
        discount_type="percentage",
        value=Decimal("20.00"),
        applicable_to="product",
        product_id=p1.id,
        is_active=True
    )
    db.add(prod_disc)
    db.commit()

    # Generate invoice with the product-specific discount explicitly passed
    res = client.post(f"/billing/generate/{sub.id}?discount_id={prod_disc.id}", headers=admin_headers)
    assert res.status_code == 200, res.text
    inv_data = res.json()

    # Widget A was $100 -> 20% discount = $20.00 discount!
    assert Decimal(inv_data["subtotal"]) == Decimal("200.00")
    assert Decimal(inv_data["discount_amount"]) == Decimal("20.00")
    assert inv_data["discount_applied"] == prod_disc.name

    # Check that usage was recorded
    db.commit()
    db.refresh(prod_disc)
    assert prod_disc.current_uses == 1


def test_discount_expiry_and_usage_limits(client: TestClient, db: Session, admin_headers):
    # Create an expired discount
    expired_disc = Discount(
        name="Expired Discount",
        discount_type="fixed",
        value=Decimal("10.00"),
        applicable_to="subscription",
        start_date=date.today() - timedelta(days=30),
        end_date=date.today() - timedelta(days=1),
        is_active=True
    )
    db.add(expired_disc)

    # Create a discount that reached maximum uses
    max_used_disc = Discount(
        name="Maxed Out Discount",
        discount_type="fixed",
        value=Decimal("15.00"),
        applicable_to="subscription",
        maximum_uses=2,
        current_uses=2,
        is_active=True
    )
    db.add(max_used_disc)
    db.commit()

    # Create dummy subscription
    cust = db.query(Customer).first()
    plan = db.query(Plan).filter(Plan.is_active.is_(True)).first()
    prod = db.query(Product).filter(Product.is_active.is_(True)).first()

    sub = Subscription(
        subscription_number=f"SUB-EXP-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan.id,
        start_date=date.today(),
        next_billing_date=date.today(),
        status="active"
    )
    db.add(sub)
    db.flush()
    db.add(SubscriptionLine(subscription_id=sub.id, product_id=prod.id, quantity=1, unit_price=Decimal("100.00"), line_total=Decimal("100.00")))
    db.commit()

    # Attempt to apply expired discount: rejected
    res = client.post(f"/billing/generate/{sub.id}?discount_id={expired_disc.id}", headers=admin_headers)
    assert res.status_code == 400
    assert "expired" in res.text.lower()

    # Attempt to apply maxed out discount: rejected
    res = client.post(f"/billing/generate/{sub.id}?discount_id={max_used_disc.id}", headers=admin_headers)
    assert res.status_code == 400
    assert "maximum usage limit reached" in res.text.lower()
