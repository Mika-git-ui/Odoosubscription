import uuid
from datetime import date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import Plan, Customer, Subscription, Product, SubscriptionLine


def test_automatic_subscription_closure_workflow(client: TestClient, db: Session, admin_headers):
    # Setup plans: one with allow_auto_close=True, one with allow_auto_close=False
    plan_auto = Plan(
        name=f"Auto-Close Plan {uuid.uuid4().hex[:4]}",
        price=Decimal("50.00"),
        billing_interval="monthly",
        allow_auto_close=True,
        is_active=True
    )
    plan_renew = Plan(
        name=f"Renewing Plan {uuid.uuid4().hex[:4]}",
        price=Decimal("50.00"),
        billing_interval="monthly",
        allow_auto_close=False,
        is_active=True
    )
    product = Product(name=f"Service {uuid.uuid4().hex[:4]}", product_type="service", sales_price=Decimal("50.00"), is_active=True)
    db.add_all([plan_auto, plan_renew, product])
    db.commit()

    cust = db.query(Customer).first()

    # Subscription 1: Expired + Plan allows auto-close -> MUST close
    sub1 = Subscription(
        subscription_number=f"SUB-CLOSE-1-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan_auto.id,
        start_date=date.today() - timedelta(days=60),
        expiry_date=date.today() - timedelta(days=10),
        status="active"
    )

    # Subscription 2: Expired + Plan DOES NOT allow auto-close -> MUST NOT close
    sub2 = Subscription(
        subscription_number=f"SUB-RENEW-2-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan_renew.id,
        start_date=date.today() - timedelta(days=60),
        expiry_date=date.today() - timedelta(days=10),
        status="active"
    )

    # Subscription 3: Expired + Paused + Plan allows auto-close -> MUST close & unpause
    sub3 = Subscription(
        subscription_number=f"SUB-PAUSED-3-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan_auto.id,
        start_date=date.today() - timedelta(days=60),
        expiry_date=date.today() - timedelta(days=10),
        status="active",
        is_paused=True
    )

    # Subscription 4: NOT expired -> MUST NOT close
    sub4 = Subscription(
        subscription_number=f"SUB-ACTIVE-4-{uuid.uuid4().hex[:6]}",
        customer_id=cust.id,
        plan_id=plan_auto.id,
        start_date=date.today() - timedelta(days=10),
        expiry_date=date.today() + timedelta(days=30),
        status="active"
    )

    db.add_all([sub1, sub2, sub3, sub4])
    db.flush()

    for s in [sub1, sub2, sub3, sub4]:
        db.add(SubscriptionLine(subscription_id=s.id, product_id=product.id, quantity=1, unit_price=Decimal("50.00"), line_total=Decimal("50.00")))
    db.commit()

    # Trigger automatic closure endpoint
    res = client.post("/subscriptions/auto-close-expired", headers=admin_headers)
    assert res.status_code == 200, res.text
    result = res.json()
    assert result["total_closed"] >= 2

    # Verify states in DB
    db.refresh(sub1)
    db.refresh(sub2)
    db.refresh(sub3)
    db.refresh(sub4)

    assert sub1.status == "closed"
    assert sub1.is_paused is False

    assert sub2.status == "active"  # Plan does not allow auto-close!

    assert sub3.status == "closed"
    assert sub3.is_paused is False

    assert sub4.status == "active"  # Not expired yet!

    # Verify idempotence: repeated execution doesn't fail or re-process already closed
    res2 = client.post("/subscriptions/auto-close-expired", headers=admin_headers)
    assert res2.status_code == 200

    # Verify expired closed subscriptions cannot receive new invoices
    inv_res = client.post(f"/billing/generate/{sub1.id}", headers=admin_headers)
    assert inv_res.status_code == 400
