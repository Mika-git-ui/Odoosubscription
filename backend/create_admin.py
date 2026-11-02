from getpass import getpass

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.entities import User
from app.core.security import hash_password


def create_admin():
    db: Session = SessionLocal()

    try:
        existing_admin = db.query(User).filter(User.role == "admin").first()

        if existing_admin:
            print(f"An admin already exists: {existing_admin.email}")
            return

        email = input("Enter admin email: ").strip().lower()
        password = getpass("Enter admin password: ")

        if len(password) < 9:
            print("Password must contain at least 9 characters.")
            return

        if db.query(User).filter(User.email == email).first():
            print("This email is already registered.")
            return

        admin = User(
            email=email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True
        )

        db.add(admin)
        db.commit()

        print(f"Admin account created successfully: {email}")

    except Exception as error:
        db.rollback()
        print("Error creating admin:", error)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()