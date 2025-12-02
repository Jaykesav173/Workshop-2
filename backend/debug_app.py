import sys
import os

# Ensure we can import from current directory
sys.path.insert(0, os.getcwd())

try:
    from main import app
    print("App imported successfully.")
    print("Routes:")
    for route in app.routes:
        print(f"  {route.path} [{route.name}]")
except Exception as e:
    print(f"Error importing app: {e}")
    import traceback
    traceback.print_exc()
