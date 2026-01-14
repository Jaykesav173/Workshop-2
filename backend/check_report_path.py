from app.database.connection import get_db
import os
import sys

# Redirect stdout to a file
sys.stdout = open("db_check_result.txt", "w", encoding="utf-8")

db = get_db()
report_id = "e7ceede1-d523-465f-a72f-2c4721696ee7"
res = db.table("Report").select("*").eq("report_id", report_id).execute()

if not res.data:
    print(f"Report {report_id} not found in DB")
else:
    report = res.data[0]
    pdf_path = report.get("pdf_path")
    print(f"DB pdf_path: {pdf_path}")
    
    if pdf_path:
        exists = os.path.exists(pdf_path)
        print(f"File exists: {exists}")
    else:
        print("pdf_path is None")
