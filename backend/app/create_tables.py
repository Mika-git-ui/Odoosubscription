from app.database import Base, engine
from app.models import entities

Base.metadata.create_all(bind=engine)

print("SUCCESS: All database tables created!")