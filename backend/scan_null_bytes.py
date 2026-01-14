import os
import sys

# Force UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

def scan_for_null_bytes(directory):
    corrupted_files = []
    print(f"Scanning {directory} for null bytes...")
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                try:
                    with open(path, "rb") as f:
                        content = f.read()
                        if b'\x00' in content:
                            # Use repr() to safely print path if it contains weird chars
                            safe_path = path.encode('utf-8', 'replace').decode('utf-8')
                            print(f"FAIL: {safe_path} contains {content.count(b'\\x00')} null bytes")
                            corrupted_files.append(safe_path)
                except Exception as e:
                    print(f"Error reading {path}: {e}")
    
    if not corrupted_files:
        print("PASS: No null bytes found in any .py files.")
    else:
        print(f"Found {len(corrupted_files)} corrupted files.")

if __name__ == "__main__":
    scan_for_null_bytes("app")
