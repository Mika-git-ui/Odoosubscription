import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import Plan, Product


def test_quotation_templates_workflow(client: TestClient, db: Session, admin_headers, staff_headers, customer_headers):
    # Setup test plan and product
    plan = Plan(name=f"Enterprise Plan {uuid.uuid4().hex[:4]}", price=Decimal("200.00"), billing_interval="monthly", minimum_quantity=1, is_active=True)
    prod1 = Product(name=f"Consulting {uuid.uuid4().hex[:4]}", product_type="service", sales_price=Decimal("150.00"), cost_price=Decimal("50.00"), is_active=True)
    prod2 = Product(name=f"Support {uuid.uuid4().hex[:4]}", product_type="service", sales_price=Decimal("50.00"), cost_price=Decimal("10.00"), is_active=True)
    db.add_all([plan, prod1, prod2])
    db.commit()

    # 1. Customer cannot create quotation template
    res = client.post("/quotation-templates/", json={
        "name": "Cust Template",
        "plan_id": plan.id,
        "validity_days": 30,
        "lines": [{"product_id": prod1.id, "quantity": 1}]
    }, headers=customer_headers)
    assert res.status_code == 403

    # 2. Rejection of invalid plan_id
    res = client.post("/quotation-templates/", json={
        "name": "Invalid Plan Template",
        "plan_id": 999999,
        "validity_days": 30,
        "lines": [{"product_id": prod1.id, "quantity": 1}]
    }, headers=staff_headers)
    assert res.status_code == 404
    assert "plan not found" in res.text.lower()

    # 3. Rejection of invalid product_id
    res = client.post("/quotation-templates/", json={
        "name": "Invalid Product Template",
        "plan_id": plan.id,
        "validity_days": 30,
        "lines": [{"product_id": 999999, "quantity": 1}]
    }, headers=staff_headers)
    assert res.status_code == 404
    assert "product with id" in res.text.lower()

    # 4. Successful creation by Staff (1 x Consulting @ $150 + 2 x Support @ $50 = $250.00)
    create_payload = {
        "name": f"Standard Quote Template {uuid.uuid4().hex[:4]}",
        "description": "Template for standard corporate onboarding",
        "plan_id": plan.id,
        "validity_days": 45,
        "lines": [
            {"product_id": prod1.id, "quantity": 1, "unit_price": 150.0},
            {"product_id": prod2.id, "quantity": 2, "unit_price": 50.0}
        ]
    }
    res = client.post("/quotation-templates/", json=create_payload, headers=staff_headers)
    assert res.status_code == 201, res.text
    template_data = res.json()
    template_id = template_data["id"]
    assert template_data["name"] == create_payload["name"]
    assert template_data["validity_days"] == 45
    assert Decimal(template_data["total_amount"]) == Decimal("250.00")
    assert len(template_data["lines"]) == 2

    # 5. Retrieve template
    res = client.get(f"/quotation-templates/{template_id}", headers=staff_headers)
    assert res.status_code == 200
    assert res.json()["id"] == template_id
    assert Decimal(res.json()["total_amount"]) == Decimal("250.00")

    # 6. List templates
    res = client.get("/quotation-templates/", headers=staff_headers)
    assert res.status_code == 200
    assert any(t["id"] == template_id for t in res.json())

    # 7. Update template (PUT) - Change lines: 2 x Consulting @ $150 = $300.00
    update_payload = {
        "name": "Updated Quote Template",
        "description": "Updated description",
        "plan_id": plan.id,
        "validity_days": 60,
        "lines": [
            {"product_id": prod1.id, "quantity": 2, "unit_price": 150.0}
        ]
    }
    res = client.put(f"/quotation-templates/{template_id}", json=update_payload, headers=admin_headers)
    assert res.status_code == 200
    assert Decimal(res.json()["total_amount"]) == Decimal("300.00")
    assert res.json()["validity_days"] == 60

    # 8. Partial update (PATCH)
    res = client.patch(f"/quotation-templates/{template_id}", json={
        "name": "Patched Quote Name"
    }, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Patched Quote Name"

    # 9. Deactivate template
    res = client.patch(f"/quotation-templates/{template_id}/deactivate", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    # 10. Delete template
    res = client.delete(f"/quotation-templates/{template_id}", headers=admin_headers)
    assert res.status_code == 200
