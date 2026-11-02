import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.models.entities import User, Customer, PasswordResetToken
from app.schemas import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.core.config import settings
from app.core.email_service import send_password_reset_email
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

bearer_scheme = HTTPBearer()


# CUSTOMER REGISTRATION
@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    # Check whether email already exists in either table
    existing_user = db.query(User).filter(User.email == data.email).first()
    existing_customer = db.query(Customer).filter(
        Customer.email == data.email
    ).first()

    if existing_user or existing_customer:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered"
        )

    try:
        new_user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            role="customer",
            is_active=True
        )

        db.add(new_user)
        db.flush()

        new_customer = Customer(
            user_id=new_user.id,
            name=data.name,
            email=data.email
        )

        db.add(new_customer)
        db.commit()
        db.refresh(new_user)

        return new_user

    except Exception:
        db.rollback()
        raise


# LOGIN
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }


# GET CURRENT LOGGED-IN USER
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# REUSABLE ROLE CHECK
def require_roles(*allowed_roles):
    def role_checker(current_user: User = Depends(get_current_user)):

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action"
            )

        return current_user

    return role_checker
@router.post("/staff", response_model=UserResponse, status_code=201)
def create_staff(
    data: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin"))
):
    existing_user = db.query(User).filter(User.email == data.email).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    try:
        staff = User(
            email=data.email,
            password_hash=hash_password(data.password),
            role="staff",
            is_active=True
        )

        db.add(staff)
        db.commit()
        db.refresh(staff)

        return staff

    except Exception:
        db.rollback()
        raise


# FORGOT PASSWORD REQUEST
@router.post("/forgot-password")
@router.post("/password-reset/request")
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    generic_response = {
        "message": "If this email is registered, a password reset link has been sent."
    }

    user = db.query(User).filter(User.email == data.email.strip().lower()).first()
    if not user or not user.is_active:
        return generic_response

    # Invalidate previous unused reset tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used.is_(False)
    ).update({"is_used": True})

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)

    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        is_used=False
    )
    db.add(reset_record)
    db.commit()

    send_password_reset_email(user.email, raw_token)
    return generic_response


# RESET PASSWORD CONFIRM
@router.post("/reset-password")
@router.post("/password-reset/confirm")
def confirm_password_reset(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(data.token.strip().encode("utf-8")).hexdigest()

    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash
    ).first()

    if not record or record.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or previously used reset token"
        )

    if record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive or not found"
        )

    user.password_hash = hash_password(data.new_password)
    record.is_used = True
    record.used_at = datetime.utcnow()

    db.commit()

    return {"message": "Password has been reset successfully"}