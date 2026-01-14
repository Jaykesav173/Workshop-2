import sys
import os
import traceback

sys.path.append(os.getcwd())

print("Testing app.database.schemas import...")
try:
    from app.database import schemas
    print("Success: schemas imported")
except Exception as e:
    print(f"Error importing schemas: {e}")
    traceback.print_exc()

print("Testing app.database.connection import...")
try:
    from app.database import connection
    print("Success: connection imported")
except Exception as e:
    print(f"Error importing connection: {e}")
    traceback.print_exc()
