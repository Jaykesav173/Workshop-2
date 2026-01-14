import os

files_to_check = [
    "app/routers/report_review/router.py",
    "app/routers/report_review/__init__.py",
    "app/routers/report_generation/router.py",
    "app/routers/report_generation/__init__.py",
    "app/routers/auth/router.py",
    "app/routers/auth/routes_auth.py",
    "app/routers/notifications/router.py"
]

for file_path in files_to_check:
    print(f"Checking {file_path}...")
    if os.path.exists(file_path):
        try:
            with open(file_path, "rb") as f:
                content = f.read()
                if b'\x00' in content:
                    print(f"❌ FAIL: {file_path}")
                else:
                    print(f"✅ PASS: {file_path}")
        except Exception as e:
            print(f"Error checking {file_path}: {e}")
    else:
        print(f"❓ Not Found: {file_path}")
