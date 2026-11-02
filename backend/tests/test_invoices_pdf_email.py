import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import Invoice, Customer, User, Subscription, Plan


def test_invoice_pdf_and_email_endpoints(client: TestClient, db: Session, admin_headers, customer_headers):
    # Retrieve an existing invoice or create one
    invoice = db.query(Invoice).first()
    assert invoice is not None, "Invoice required for test"

    # 1. Admin can download PDF
    res_pdf = client.get(f"/billing/invoices/{invoice.id}/pdf", headers=admin_headers)
    assert res_pdf.status_code == 200, res_pdf.text
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF-")
    assert len(res_pdf.content) > 500

    # 2. Other customer cannot access invoice PDF
    other_user = User(
        email=f"intruder_{uuid.uuid4().hex[:6]}@example.com",
        password_hash="fakehash",
        role="customer",
        is_active=True
    )
    db.add(other_user)
    db.flush()
    db.add(Customer(user_id=other_user.id, name="Intruder", email=other_user.email))
    db.commit()

    from app.core.security import create_access_token
    intruder_token = create_access_token(other_user.id)
    intruder_headers = {"Authorization": f"Bearer {intruder_token}"}

    res_forbidden = client.get(f"/billing/invoices/{invoice.id}/pdf", headers=intruder_headers)
    assert res_forbidden.status_code == 403

    # 3. Invoice email endpoint
    # When SMTP is not configured, it should return 503 with clear configuration error
    # Rather than pretending it sent or crashing
    res_email = client.post(f"/billing/invoices/{invoice.id}/send-email", headers=admin_headers)
    # Status code is 503 (or 200 if SMTP happens to be set up)
    if res_email.status_code == 503:
        assert "Email service is not configured" in res_email.json()["detail"]
    else:
        assert res_email.status_code == 200

    # Ensure invoice payment status is NOT altered merely because email was attempted
    db.refresh(invoice)
    assert invoice.status != "paid" or invoice.total_amount == 0
