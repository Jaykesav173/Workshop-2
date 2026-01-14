from app.database.connection import get_db
import json
import sys

sys.stdout = open("photos_check.txt", "w", encoding="utf-8")

db = get_db()
report_id = "e7ceede1-d523-465f-a72f-2c4721696ee7"
res = db.table("Report").select("*").eq("report_id", report_id).execute()

if res.data:
    report = res.data[0]
    content = report.get("content")
    if content:
        data = json.loads(content)
        photos = data.get("photos", [])
        print(f"Total photos: {len(photos)}")
        for i, p in enumerate(photos):
            print(f"Photo {i}:")
            print(f"  file_path: {p.get('file_path')}")
            print(f"  storage_url: {p.get('storage_url')}")
            print(f"  finding_key: {p.get('finding_key')}")
    else:
        print("No content")
else:
    print("Report not found")
