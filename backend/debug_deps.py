import sys
import os
import traceback

sys.path.append(os.getcwd())

print("Checking dependencies...")

try:
    print("Importing app.database.connection...")
    from app.database import connection
    print("✅ app.database.connection imported")
except Exception as e:
    print(f"❌ Failed to import app.database.connection: {e}")

try:
    print("Importing app.database.schemas...")
    from app.database import schemas
    print("✅ app.database.schemas imported")
except Exception as e:
    print(f"❌ Failed to import app.database.schemas: {e}")

try:
    print("Importing app.routers.InspectionSchedule.service...")
    from app.routers.InspectionSchedule import service
    print("✅ app.routers.InspectionSchedule.service imported")
except Exception as e:
    print(f"❌ Failed to import service: {e}")
