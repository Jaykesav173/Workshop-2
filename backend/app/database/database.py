# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Get DATABASE_URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("⚠️  WARNING: DATABASE_URL not set. SQLAlchemy/PostgreSQL features will be unavailable.")
    engine = None
    SessionLocal = None
else:
    # Create SQLAlchemy engine
    try:
        engine = create_engine(
            DATABASE_URL,
            echo=True,
        )
        # Session factory
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine
        )
    except Exception as e:
        print(f"❌ Error creating SQLAlchemy engine: {e}")
        engine = None
        SessionLocal = None

# Base class for ORM models (still needed for models.py)
Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    if SessionLocal is None:
        raise ValueError("Database not configured (missing DATABASE_URL)")
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
