from app.database.connection import get_db
import sys
import json

sys.stdout = open("db_content_check.txt", "w", encoding="utf-8")

db = get_db()
report_id = "e7ceede1-d523-465f-a72f-2c4721696ee7"
res = db.table("Report").select("*").eq("report_id", report_id).execute()

if res.data:
    report = res.data[0]
    content = report.get("content")
    if content:
        print("Content field exists.")
        try:
            # Try to parse it just to be sure
            data = json.loads(content)
            print(f"Content is valid JSON. Keys: {list(data.keys())}")
        except:
            print("Content is not valid JSON")
    else:
        print("Content field is empty")
else:
    print("Report not found")
