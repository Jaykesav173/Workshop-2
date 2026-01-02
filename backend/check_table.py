import os
import sys
from app.database.connection import get_db

# Ensure backend path
sys.path.append(os.getcwd())

def check_table():
    db = get_db()
    print("Checking 'notifications' table...")
    try:
        # Try to insert a dummy record to verify write access
        # Using a negative ID for user_id to hopefully avoid FK issues if any constraints are weak, 
        # or better, query a known user. 
        # But select is safer to check existence.
        
        # Check if table exists by selecting 0 rows
        res = db.table("notifications").select("count", count="exact").limit(0).execute()
        print(f"✅ Table 'notifications' exists. Count: {res.count}")
        
    except Exception as e:
        print(f"❌ Table check failed: {e}")
        print("Detailed error:", str(e))

if __name__ == "__main__":
    check_table()
