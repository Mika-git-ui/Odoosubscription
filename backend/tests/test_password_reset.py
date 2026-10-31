import hashlib
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.entities import User, PasswordResetToken
from app.core.security import hash_password


def test_password_reset_workflow(client: TestClient, db: Session):
    # Setup test user
    email = f"reset_test_{uuid.uuid4().hex[:6]}@example.com"
    original_pass = "OriginalPass123!"
    user = User(
        email=email,
        password_hash=hash_password(original_pass),
        role="customer",
        is_active=True
    )
    db.add(user)
    db.commit()

    # 1. Non-existent email request returns same generic response (prevents account enumeration)
    fake_res = client.post("/auth/forgot-password", json={"email": "nonexistent_999@example.com"})
    assert fake_res.status_code == 200
    assert "If this email is registered" in fake_res.json()["message"]

    # 2. Existing user request returns generic response
    res = client.post("/auth/forgot-password", json={"email": email})
    assert res.status_code == 200
    assert "If this email is registered" in res.json()["message"]

    # Verify token was created in DB and hashed (NOT plain text)
    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used.is_(False)
    ).first()
    assert token_record is not None
    assert token_record.token_hash is not None
    # SHA-256 hash length is 64 hex characters
    assert len(token_record.token_hash) == 64

    # 3. Test password complexity validation on new password
    # Missing uppercase / special char
    simple_pass_res = client.post("/auth/reset-password", json={
        "token": "dummytokentestinglength12345",
        "new_password": "simplepassword"
    })
    assert simple_pass_res.status_code == 422

    # 4. Create an explicit raw token and hash it for testing consumption
    raw_token = f"valid_test_token_{uuid.uuid4().hex}"
    valid_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    test_token_record = PasswordResetToken(
        user_id=user.id,
        token_hash=valid_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
        is_used=False
    )
    db.add(test_token_record)
    db.commit()

    # Consume the valid token with a compliant new password
    new_password = "BrandNewPassword123!"
    reset_res = client.post("/auth/reset-password", json={
        "token": raw_token,
        "new_password": new_password
    })
    assert reset_res.status_code == 200, reset_res.text
    assert "Password has been reset successfully" in reset_res.json()["message"]

    # 5. Token is now marked used and cannot be reused
    db.refresh(test_token_record)
    assert test_token_record.is_used is True

    reuse_res = client.post("/auth/reset-password", json={
        "token": raw_token,
        "new_password": "AnotherNewPassword123!"
    })
    assert reuse_res.status_code == 400
    assert "previously used" in reuse_res.text.lower() or "invalid" in reuse_res.text.lower()

    # 6. Test expired token rejection
    expired_raw = f"expired_test_token_{uuid.uuid4().hex}"
    expired_hash = hashlib.sha256(expired_raw.encode("utf-8")).hexdigest()
    expired_record = PasswordResetToken(
        user_id=user.id,
        token_hash=expired_hash,
        expires_at=datetime.utcnow() - timedelta(minutes=5),  # already expired
        is_used=False
    )
    db.add(expired_record)
    db.commit()

    expired_res = client.post("/auth/reset-password", json={
        "token": expired_raw,
        "new_password": "AnotherNewPassword123!"
    })
    assert expired_res.status_code == 400
    assert "expired" in expired_res.text.lower()

    # 7. Login with new password succeeds, old password fails
    old_login = client.post("/auth/login", json={"email": email, "password": original_pass})
    assert old_login.status_code == 401

    new_login = client.post("/auth/login", json={"email": email, "password": new_password})
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()
