import os

files_to_check = [
    "app/main.py",
    "app/routers/notifications/router.py"
]

for file_path in files_to_check:
    print(f"Checking {file_path}...")
    try:
        with open(file_path, "rb") as f:
            content = f.read()
            if b'\x00' in content:
                print(f"❌ FAIL: Null bytes found in {file_path}. Count: {content.count(b'\\x00')}")
            else:
                print(f"✅ PASS: No null bytes found in {file_path}")
    except Exception as e:
        print(f"Error checking {file_path}: {e}")
