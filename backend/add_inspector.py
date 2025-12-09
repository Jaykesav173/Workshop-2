"""
Quick script to add an inspector to the database
Run this from the backend/app directory
"""
import bcrypt
import sys
import os
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import get_db

def add_inspector():
    """Add an inspector user to the database"""
    
    # ============================================
    # EDIT THESE VALUES
    # ============================================
    name = "John Inspector"
    email = "inspector@example.com"
    username = "inspector1"
    password = "password123"  # Change this!
    role = "INSPECTOR"  # Options: 'ADMIN', 'INSPECTOR', 'USER'
    account_status = "ACTIVE"  # Options: 'ACTIVE', 'INACTIVE'
    # ============================================
    
    try:
        db = get_db()
        
        # Check if user already exists
        existing = db.table("User").select("id").or_(
            f"username.eq.{username},email.eq.{email}"
        ).execute()
        
        if existing.data:
            print(f"❌ User with username '{username}' or email '{email}' already exists!")
            return
        
        # Hash password
        hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        
        # Create user data
        new_user = {
            "name": name,
            "email": email,
            "username": username,
            "hashed_password": hashed_pw,
            "role": role,
            "Account_status": account_status,
            "created_at": str(datetime.utcnow())
        }
        
        # Insert into database
        res = db.table("User").insert(new_user).execute()
        
        if res.data:
            user = res.data[0]
            user.pop("hashed_password", None)  # Don't show password
            print("✅ Inspector added successfully!")
            print(f"   ID: {user['id']}")
            print(f"   Name: {user['name']}")
            print(f"   Username: {user['username']}")
            print(f"   Email: {user['email']}")
            print(f"   Role: {user['role']}")
            print(f"   Status: {user['Account_status']}")
        else:
            print("❌ Failed to add inspector")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("Adding inspector to database...")
    print("=" * 50)
    add_inspector()


