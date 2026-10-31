import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal
from app.models.entities import User, Customer
from app.core.security import create_access_token, hash_password


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def db():
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="session")
def admin_user():
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "admin").first()
        if not user:
            user = User(
                email="admin_test@brightloop.local",
                password_hash=hash_password("Admin@12345"),
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()


@pytest.fixture(scope="session")
def staff_user():
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "staff").first()
        if not user:
            user = User(
                email="staff_test@brightloop.local",
                password_hash=hash_password("Staff@12345"),
                role="staff",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()


@pytest.fixture(scope="session")
def customer_user():
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "customer").first()
        if not user:
            user = User(
                email="cust_test@brightloop.local",
                password_hash=hash_password("Cust@12345"),
                role="customer",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            cust = Customer(
                user_id=user.id,
                name="Test Customer",
                email=user.email,
                phone="1234567890",
                address="123 Test St"
            )
            db.add(cust)
            db.commit()
        return user
    finally:
        db.close()


@pytest.fixture(scope="session")
def admin_headers(admin_user):
    token = create_access_token(admin_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def staff_headers(staff_user):
    token = create_access_token(staff_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def customer_headers(customer_user):
    token = create_access_token(customer_user.id)
    return {"Authorization": f"Bearer {token}"}
