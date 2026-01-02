"""
Configuration settings for VISOR application
Loads environment variables and provides app-wide settings
"""
import os
from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file - check app directory first, then project root
env_path = Path(__file__).parent / ".env"
if not env_path.exists():
    # Try project root (backend/.env)
    env_path = Path(__file__).parent.parent / ".env"

if env_path.exists():
    print(f"✅ Loading environment from: {env_path}")
    load_dotenv(dotenv_path=env_path)
else:
    print("⚠️  WARNING: No .env file found in app/ or backend/ directory")

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    # IMPORTANT: Use SERVICE_ROLE_KEY (not anon key) to bypass RLS
    # Service role key starts with "eyJ..." and is much longer than anon key
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    # Alternative: explicitly use service role key if provided
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # AI configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    def __init__(self, **values):
        super().__init__(**values)
        if self.OPENAI_API_KEY:
             print(f"DEBUG: OPENAI_API_KEY loaded (starts with {self.OPENAI_API_KEY[:5]}...)")
        else:
             print("DEBUG: OPENAI_API_KEY is missing or empty!")
             # Try manual read as fallback debug
             try:
                 with open(Path(__file__).parent / ".env", "r") as f:
                     content = f.read()
                     if "OPENAI_API_KEY" in content:
                         print("DEBUG: Found OPENAI_API_KEY in .env file directly (parser issue?)")
             except Exception as e:
                 print(f"DEBUG: Could not read .env file directly: {e}")

    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
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
    SMTP_USER: str = os.getenv("SMTP_USER") or os.getenv("SMTP_EMAIL", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

# Use service role key if provided, otherwise fall back to SUPABASE_KEY
if settings.SUPABASE_SERVICE_ROLE_KEY:
    settings.SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY
    print("✅ Using SUPABASE_SERVICE_ROLE_KEY (service role key)")
elif settings.SUPABASE_KEY:
    # Check if it looks like an anon key (shorter, starts with eyJ)
    # Service role keys are typically longer
    if len(settings.SUPABASE_KEY) < 200:
        print("⚠️  WARNING: SUPABASE_KEY appears to be an anon key (too short)")
        print("   Backend needs SERVICE_ROLE_KEY to bypass RLS")
        print("   Get it from: Supabase Dashboard > Settings > API > service_role key")
    else:
        print("✅ Using SUPABASE_KEY (assuming it's service role key)")

# Validate required settings
if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
    raise ValueError("❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables")
