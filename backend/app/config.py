"""
Configuration settings for VISOR application
Loads environment variables and provides app-wide settings
"""
import os
from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file - look in app directory
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fixed-secret-key-for-dev-12345")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://172.20.10.11:5173",
        "http://172.20.10.2:5173",
        "*"  # Remove in production
    ]
    
    # Storage Configuration
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "storage", "uploads")
    REPORTS_DIR: str = os.path.join(os.path.dirname(__file__), "storage", "reports")
    
    # AI Model Configuration
    MODEL_PATH: str = os.path.join(os.path.dirname(__file__), "ai_models", "model.tflite")
    
    # Email Configuration (for notifications)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Validate required settings
if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
    raise ValueError("❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables")

