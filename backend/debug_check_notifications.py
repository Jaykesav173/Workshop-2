
import os
import sys
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import supabase

def test_notification_query():
    print("🚀 Testing Notification Query...")
    
    # 1. Fetch 1 row to verify schema
    try:
        res = supabase.table("Report").select("*").limit(1).execute()
        if res.data:
            print("✅ Report Columns:", res.data[0].keys())
        else:
            print("⚠️ No reports found.")
            
        # 2. Try the filter query again
        seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
        res = supabase.table("Report").select("*") \
            .in_("status", ["APPROVED", "REJECTED"]) \
            .gt("updated_at", seven_days_ago) \
            .execute()
            
        print(f"✅ Query successful. Found {len(res.data)} reports.")
    except Exception as e:
        print(f"❌ Query failed: {e}")

if __name__ == "__main__":
    test_notification_query()
