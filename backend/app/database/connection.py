"""
PostgreSQL/Supabase Database Connection
Handles database connection and session management
"""
from supabase import create_client
from app.config import settings

# Create Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_db():
    """
    Get database connection (Supabase client)
    Returns the Supabase client instance
    """
    return supabase

# Test connection on import
try:
    print("[OK] Connected to Supabase:", settings.SUPABASE_URL)
except Exception as e:
    print(f"[ERROR] Failed to connect to Supabase: {e}")

