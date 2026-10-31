import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.entities import Customer, User, Subscription, Plan, Product, SubscriptionLine


def test_customer_registration_and_login(client: TestClient):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    # Registration with valid complex password
    res = client.post("/auth/register", json={
        "name": "Jane Doe",
        "email": unique_email,
        "password": "Password123!"
    })
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["email"] == unique_email
    assert data["role"] == "customer"

    # Login
    login_res = client.post("/auth/login", json={
        "email": unique_email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"

    # Login with wrong password fails
    wrong_res = client.post("/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword123!"
    })
    assert wrong_res.status_code == 401


def test_admin_can_create_staff(client: TestClient, admin_headers):
    staff_email = f"staff_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/auth/staff", json={
        "name": "Staff Member",
        "email": staff_email,
        "password": "StaffPassword123!"
    }, headers=admin_headers)
    assert res.status_code == 201, res.text
    assert res.json()["role"] == "staff"


def test_staff_cannot_create_staff(client: TestClient, staff_headers):
    res = client.post("/auth/staff", json={
        "name": "Another Staff",
        "email": f"staff_{uuid.uuid4().hex[:8]}@example.com",
        "password": "StaffPassword123!"
    }, headers=staff_headers)
    assert res.status_code == 403


def test_customer_cannot_access_other_customer_subscription(client: TestClient, db: Session, customer_headers):
    # Create another customer with subscription
    other_user = User(
        email=f"other_{uuid.uuid4().hex[:8]}@example.com",
        password_hash="fakehash",
        role="customer",
        is_active=True
    )
    db.add(other_user)
    db.flush()

    other_cust = Customer(
        user_id=other_user.id,
        name="Other Customer",
        email=other_user.email
    )
    db.add(other_cust)
    db.flush()

    # Find or create plan
    plan = db.query(Plan).filter(Plan.is_active.is_(True)).first()
    if not plan:
        plan = Plan(name="Basic", price=Decimal("10.00"), billing_interval="monthly", is_active=True)
        db.add(plan)
        db.flush()

    other_sub = Subscription(
        subscription_number=f"SUB-OTHER-{uuid.uuid4().hex[:6]}",
        customer_id=other_cust.id,
        plan_id=plan.id,
        start_date="2026-01-01",
        status="active"
    )
    db.add(other_sub)
    db.commit()

    # Current customer tries to access other customer's subscription
    res = client.get(f"/subscriptions/{other_sub.id}", headers=customer_headers)
    assert res.status_code == 403
