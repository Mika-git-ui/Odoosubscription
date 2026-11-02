import uuid
from datetime import date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import Plan, Customer, Subscription, Product, SubscriptionLine, Invoice


def test_single_and_batch_billing_workflow(client: TestClient, db: Session, admin_headers):
    cust = db.query(Customer).first()
    plan = Plan(name=f"Monthly Plan {uuid.uuid4().hex[:4]}", price=Decimal("100.00"), billing_interval="monthly", is_active=True)
    prod = Product(name=f"Hosting {uuid.uuid4().hex[:4]}", product_type="service", sales_price=Decimal("100.00"), is_active=True)
    db.add_all([plan, prod])
    db.commit()

    # Subscription A: Due today -> Single generation test
    sub_a = Subscription(
        subscription_number=f"SUB-A-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan.id,
        start_date=date.today(),
        next_billing_date=date.today(),
        status="active"
    )
    db.add(sub_a)
    db.flush()
    db.add(SubscriptionLine(subscription_id=sub_a.id, product_id=prod.id, quantity=1, unit_price=Decimal("100.00"), line_total=Decimal("100.00")))
    db.commit()

    # 1. Single generation works
    res = client.post(f"/billing/generate/{sub_a.id}", headers=admin_headers)
    assert res.status_code == 200, res.text
    inv_data = res.json()
    assert inv_data["subscription_id"] == sub_a.id
    assert inv_data["status"] == "draft"

    # 2. Duplicate generation for same period rejected (409)
    # Roll back next_billing_date to trigger same period
    db.commit()
    sub_a_record = db.query(Subscription).filter(Subscription.id == sub_a.id).first()
    sub_a_record.next_billing_date = date.today()
    db.commit()
    res_dup = client.post(f"/billing/generate/{sub_a.id}", headers=admin_headers)
    assert res_dup.status_code == 409

    # Setup for batch billing:
    # Sub B: Due today, eligible -> Should succeed
    sub_b = Subscription(
        subscription_number=f"SUB-B-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=30),
        next_billing_date=date.today(),
        status="active"
    )
    # Sub C: Paused -> Should be skipped / not eligible
    sub_c = Subscription(
        subscription_number=f"SUB-C-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=30),
        next_billing_date=date.today(),
        status="active",
        is_paused=True
    )
    # Sub D: In draft status -> Should be skipped
    sub_d = Subscription(
        subscription_number=f"SUB-D-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan.id,
        start_date=date.today() - timedelta(days=30),
        next_billing_date=date.today(),
        status="draft"
    )

    db.add_all([sub_b, sub_c, sub_d])
    db.flush()
    db.add(SubscriptionLine(subscription_id=sub_b.id, product_id=prod.id, quantity=1, unit_price=Decimal("100.00"), line_total=Decimal("100.00")))
    db.add(SubscriptionLine(subscription_id=sub_c.id, product_id=prod.id, quantity=1, unit_price=Decimal("100.00"), line_total=Decimal("100.00")))
    db.add(SubscriptionLine(subscription_id=sub_d.id, product_id=prod.id, quantity=1, unit_price=Decimal("100.00"), line_total=Decimal("100.00")))
    db.commit()

    # Execute batch generation
    batch_res = client.post("/billing/batch-generate", headers=admin_headers)
    assert batch_res.status_code == 200, batch_res.text
    batch_data = batch_res.json()
    assert batch_data["invoices_generated_count"] >= 1
    # Check that Sub B was billed
    success_sub_ids = [inv["subscription_id"] for inv in batch_data["successful_invoices"]]
    assert sub_b.id in success_sub_ids

    # Sub C (paused) and Sub D (draft) were not billed
    assert sub_c.id not in success_sub_ids
    assert sub_d.id not in success_sub_ids
