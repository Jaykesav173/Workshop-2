import sys
import os
import bcrypt
from datetime import datetime
from database import supabase

# Ensure we can import from current directory
sys.path.insert(0, os.getcwd())

def test_add_user():
    print("Testing add_user...")
    try:
        data = {
            "name": "Test User",
            "email": "test@example.com",
            "username": "testuser",
            "password": "password123",
            "role": "USER",
            "Account_status": "ACTIVE"
        }
        
        # Check for duplicates
        existing = supabase.table("User").select("id").or_(
            f"username.eq.{data['username']},email.eq.{data['email']}"
        ).execute()

        if existing.data:
            print("User already exists")
            return

        # Hash password
        hashed_pw = bcrypt.hashpw(data['password'].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        new_user = {
            "id": 88888,
            "name": data['name'],
            "email": data['email'],
            "username": data['username'],
            "hashed_password": hashed_pw,
            "role": data['role'],
            "Account_status": data['Account_status'],
            "created_at": str(datetime.utcnow())
        }

        res = supabase.table("User").insert(new_user).execute()
        print("Result:", res.data)

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_add_user()
