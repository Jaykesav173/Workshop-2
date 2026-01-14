import os

file_path = "app/database/connection.py"
output_file = "connection_check.txt"

with open(output_file, "w") as out:
    try:
        if not os.path.exists(file_path):
             out.write(f"ERROR: {file_path} does not exist")
        else:
            with open(file_path, "rb") as f:
                content = f.read()
                if b'\x00' in content:
                    out.write(f"FAIL: Null bytes found in {file_path}. Count: {content.count(b'\\x00')}")
                else:
                    out.write(f"PASS: No null bytes found in {file_path}")
    except Exception as e:
        out.write(f"ERROR: {e}")

print("Done check.")
