import os
import sys
from app.database.connection import get_db

sys.path.append(os.getcwd())

def count_users():
    db = get_db()
    try:
        res = db.table("User").select("count", count="exact").limit(0).execute()
        print(f"User (Capital U) Count: {res.count}")
    except Exception as e:
        print(f"Error counting User: {e}")
        
    try:
        res = db.table("users").select("count", count="exact").limit(0).execute()
        print(f"users (lowercase u) Count: {res.count}")
    except Exception as e:
        print(f"Error counting users: {e}")

if __name__ == "__main__":
    count_users()
