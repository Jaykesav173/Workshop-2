import sys
import os
import importlib.util
import traceback

sys.path.append(os.getcwd())

print("Attempting to import InspectionSchedule router via importlib...")

try:
    spec = importlib.util.spec_from_file_location("schedule_router", "app/routers/InspectionSchedule/router.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    router = module.router
    print("Success: router imported via importlib")
    print(f"Router has {len(router.routes)} routes")
    
except Exception as e:
    print(f"Failed to import router via importlib: {e}")
    traceback.print_exc()

print("Done.")
