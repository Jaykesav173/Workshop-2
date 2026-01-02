
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path

# Try multiple locations for .env
env_paths = [
    Path("c:/Users/HP/Workshop2-asillah/backend/app/.env"),
    Path("c:/Users/HP/Workshop2-asillah/backend/.env"),
    Path("c:/Users/HP/Workshop2-asillah/.env")
]

for env_path in env_paths:
    if env_path.exists():
        print(f"Loading .env from {env_path}")
        load_dotenv(dotenv_path=env_path)
        break

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("WARNING: DATABASE_URL not found in .env files. Checking os.environ...")
    DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    # Use Supabase settings if DATABASE_URL is missing
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    print(f"Supabase settings: URL={SUPABASE_URL[:20]}... KEY={SUPABASE_KEY[:10]}...")
    # I can't easily construct the DB URL from just URL/KEY without assuming postgres format
    raise ValueError("DATABASE_URL not found")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("--- RECENT PHOTOS ---")
    try:
        result = conn.execute(text("SELECT id, file_name, uploaded_by, uploaded_at FROM \"Photo\" ORDER BY uploaded_at DESC LIMIT 5"))
        for row in result:
            print(row)
    except Exception as e:
        print(f"Error querying Photo table: {e}")
    
    print("\n--- RECENT USERS ---")
    try:
        result = conn.execute(text("SELECT id, username, role FROM \"User\" LIMIT 5"))
        for row in result:
            print(row)
    except Exception as e:
        print(f"Error querying User table: {e}")
