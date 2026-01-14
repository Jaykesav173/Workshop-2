import sys
import os
import logging

# Mute logging to avoid noise
logging.basicConfig(level=logging.CRITICAL)

sys.path.append(os.getcwd())

try:
    from app.main import app
    print("Successfully imported app")
    
    print("Registered Routes:")
    found_notifications = False
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"  - {route.path}")
            if "/notifications" in route.path:
                found_notifications = True
    
    if found_notifications:
        print("\n✅ Notifications endpoint FOUND.")
    else:
        print("\n❌ Notifications endpoint NOT FOUND.")

except Exception as e:
    print(f"Failed to import app: {e}")
    import traceback
    traceback.print_exc()
