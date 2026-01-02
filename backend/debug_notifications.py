import os
import sys

# Ensure we are in backend or can find app
if 'backend' not in os.getcwd():
    sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database.connection import get_db

def test_db():
    db = get_db()
    
    print("Testing table 'Notifications'...")
    try:
        res = db.table("Notifications").select("*").limit(1).execute()
        print(f"✅ 'Notifications' exists. Data: {res.data}")
    except Exception as e:
        print(f"❌ 'Notifications' failed: {e}")

    print("\nTesting table 'notifications' (lowercase)...")
    try:
        res = db.table("notifications").select("*").limit(1).execute()
        print(f"✅ 'notifications' exists. Data: {res.data}")
    except Exception as e:
        print(f"❌ 'notifications' failed: {e}")

    # Try insert into the working one
    test_data = {
        "user_id": 99999,
        "type": "Test", 
        "title": "Debug", 
        "message": "Debug msg",
        "created_at": "2025-01-01 12:00:00"
    }
    
    # We will try inserting if we found a working table
    # ...

if __name__ == "__main__":
    test_db()
