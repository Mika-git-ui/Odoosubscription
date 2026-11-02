import uuid
from decimal import Decimal
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import Customer, Plan, Product, Subscription, SubscriptionLine, Invoice


def test_core_lifecycle_and_billing_regression(client: TestClient, db: Session, admin_headers, staff_headers):
    # 1. Product creation (Catalog)
    p_name = f"Core Product {uuid.uuid4().hex[:6]}"
    p_res = client.post("/products/", json={
        "name": p_name,
        "product_type": "service",
        "sales_price": 80.0,
        "cost_price": 20.0
    }, headers=admin_headers)
    assert p_res.status_code == 200, p_res.text
    product_id = p_res.json()["id"]

    # 2. Plan creation (Catalog)
    plan_name = f"Lifecycle Plan {uuid.uuid4().hex[:6]}"
    plan_res = client.post("/plans/", json={
        "name": plan_name,
        "price": 80.0,
        "billing_interval": "monthly",
        "allow_pause": True,
        "allow_early_close": True
    }, headers=admin_headers)
    assert plan_res.status_code == 200, plan_res.text
    plan_id = plan_res.json()["id"]

    # 3. Customer retrieval / creation
    cust = db.query(Customer).first()

    # 4. Subscription creation
    sub_res = client.post("/subscriptions/", json={
        "customer_id": cust.id,
        "plan_id": plan_id,
        "start_date": str(date.today()),
        "payment_terms": "Net 15",
        "lines": [{"product_id": product_id, "quantity": 1}]
    }, headers=staff_headers)
    assert sub_res.status_code == 200, sub_res.text
    sub_id = sub_res.json()["id"]
    assert sub_res.json()["status"] == "draft"

    # 5. Lifecycle transitions: draft -> quotation -> confirmed -> active
    t1 = client.patch(f"/subscriptions/{sub_id}/status?new_status=quotation", headers=staff_headers)
    assert t1.status_code == 200
    assert t1.json()["status"] == "quotation"

    t2 = client.patch(f"/subscriptions/{sub_id}/status?new_status=confirmed", headers=staff_headers)
    assert t2.status_code == 200
    assert t2.json()["status"] == "confirmed"

    t3 = client.patch(f"/subscriptions/{sub_id}/status?new_status=active", headers=staff_headers)
    assert t3.status_code == 200
    assert t3.json()["status"] == "active"

    # 6. Pause and resume
    pause_res = client.patch(f"/subscriptions/{sub_id}/pause", headers=staff_headers)
    assert pause_res.status_code == 200
    assert "paused successfully" in pause_res.json()["message"]

    resume_res = client.patch(f"/subscriptions/{sub_id}/resume", headers=staff_headers)
    assert resume_res.status_code == 200
    assert "resumed successfully" in resume_res.json()["message"]

    # 7. Invoice generation
    inv_res = client.post(f"/billing/generate/{sub_id}", headers=staff_headers)
    assert inv_res.status_code == 200, inv_res.text
    inv_data = inv_res.json()
    invoice_id = inv_data["invoice_id"]
    assert inv_data["status"] == "draft"

    # 8. Confirm invoice
    conf_res = client.post(f"/billing/invoices/{invoice_id}/confirm", headers=staff_headers)
    assert conf_res.status_code == 200
    assert conf_res.json()["status"] == "confirmed"

    # 9. Invoice balance check
    bal_res = client.get(f"/billing/invoices/{invoice_id}/balance", headers=staff_headers)
    assert bal_res.status_code == 200
    bal_data = bal_res.json()
    total_amount = Decimal(bal_data["invoice_total"])
    assert Decimal(bal_data["paid_amount"]) == Decimal("0.00")
    assert Decimal(bal_data["outstanding_balance"]) == total_amount

    # 10. Partial payment
    part_payment = Decimal("30.00")
    pay_res = client.post(f"/billing/invoices/{invoice_id}/payments", json={
        "payment_method": "credit_card",
        "amount": float(part_payment),
        "payment_date": str(date.today()),
        "note": "Partial payment"
    }, headers=staff_headers)
    assert pay_res.status_code == 200, pay_res.text
    assert pay_res.json()["invoice_status"] == "confirmed"
    assert Decimal(pay_res.json()["paid_amount"]) == part_payment

    # 11. Remaining payment (complete payment)
    remaining = total_amount - part_payment
    pay2_res = client.post(f"/billing/invoices/{invoice_id}/payments", json={
        "payment_method": "bank_transfer",
        "amount": float(remaining),
        "payment_date": str(date.today()),
        "note": "Final settlement"
    }, headers=staff_headers)
    assert pay2_res.status_code == 200, pay2_res.text
    assert pay2_res.json()["invoice_status"] == "paid"
    assert Decimal(pay2_res.json()["outstanding_balance"]) == Decimal("0.00")

    # 12. Close subscription early
    close_res = client.patch(f"/subscriptions/{sub_id}/close?early=true", headers=staff_headers)
    assert close_res.status_code == 200
    assert "closed successfully" in close_res.json()["message"]
