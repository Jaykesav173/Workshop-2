import sys
import os
import traceback

# Add the current directory to sys.path so we can import from app
sys.path.append(os.getcwd())

print("Attempting to import InspectionSchedule router...")

try:
    from app.routers.InspectionSchedule.router import router
    print("Successfully imported router")
except Exception as e:
    print(f"Failed to import router: {e}")
    traceback.print_exc()

print("Done.")
