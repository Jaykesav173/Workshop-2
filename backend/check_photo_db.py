from app.database.connection import get_db
import sys

sys.stdout = open("check_photo_db.txt", "w", encoding="utf-8")

db = get_db()
# Try different likely table names
for table in ["uploadedphoto", "photo", "Photo", "photos"]:
    try:
        print(f"Checking table: {table}")
        res = db.table(table).select("*").eq("id", 228).execute()
        if res.data:
            print(f"Found in {table}: {res.data[0]}")
        else:
            print(f"Not found in {table}")
    except Exception as e:
        print(f"Error checking {table}: {e}")
