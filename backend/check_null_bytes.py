import os

file_path = "app/routers/InspectionSchedule/router.py"

try:
    with open(file_path, "rb") as f:
        content = f.read()
        if b'\x00' in content:
            print(f"❌ Null bytes found in {file_path}")
            print(f"Total null bytes: {content.count(b'\\x00')}")
        else:
            print(f"✅ No null bytes found in {file_path}")
            
    # Also check service.py
    file_path = "app/routers/InspectionSchedule/service.py"
    with open(file_path, "rb") as f:
        content = f.read()
        if b'\x00' in content:
            print(f"❌ Null bytes found in {file_path}")
            print(f"Total null bytes: {content.count(b'\\x00')}")
        else:
             print(f"✅ No null bytes found in {file_path}")

except Exception as e:
    print(f"Error checking file: {e}")
