
import asyncio
import os
from app.database.connection import get_db
from app.config import settings
import sys

# Ensure we can import app
sys.path.append(os.getcwd())

async def check_reports():
    print(f"Checking REPORTS_DIR: {settings.REPORTS_DIR}")
    if os.path.exists(settings.REPORTS_DIR):
        print(f"✅ REPORTS_DIR exists")
        files = os.listdir(settings.REPORTS_DIR)
        print(f"📂 Files in REPORTS_DIR: {files}")
    else:
        print(f"❌ REPORTS_DIR does NOT exist")

    try:
        db = get_db()
        # Fetch recent reports
        res = db.table("Report").select("report_id, title, pdf_path, status, created_at").order("created_at", desc=True).limit(5).execute()
        
        reports = res.data
        print(f"\nFound {len(reports)} recent reports:")
        
        for r in reports:
            print(f"\n--- Report: {r['title']} ({r['report_id']}) ---")
            print(f"    Status: {r['status']}")
            print(f"    Created: {r['created_at']}")
            pdf_path = r['pdf_path']
            print(f"    DB PDF Path: {pdf_path}")
            
            if pdf_path:
                exists = os.path.exists(pdf_path)
                print(f"    File Exists? {'✅ YES' if exists else '❌ NO'}")
                if not exists:
                    # Check if it's just a relative path issue
                    basename = os.path.basename(pdf_path)
                    potential_path = os.path.join(settings.REPORTS_DIR, basename)
                    if os.path.exists(potential_path):
                         print(f"    ⚠️ Found file at {potential_path} but DB has {pdf_path}")
            else:
                print("    ❌ No PDF Path in DB")

    except Exception as e:
        print(f"Error checking DB: {e}")

if __name__ == "__main__":
    asyncio.run(check_reports())
