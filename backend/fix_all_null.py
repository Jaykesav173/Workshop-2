import os

def fix_null_bytes(directory):
    print(f"Scanning {directory} for null bytes and fixing...")
    fixed_count = 0
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                try:
                    with open(path, "rb") as f:
                        content = f.read()
                    
                    if b'\x00' in content:
                        print(f"Found null bytes in {path}. Fixing...")
                        # Remove null bytes
                        new_content = content.replace(b'\x00', b'')
                        
                        # Write back
                        with open(path, "wb") as f:
                            f.write(new_content)
                        print(f"✅ Fixed {path}")
                        fixed_count += 1
                except Exception as e:
                    print(f"Error processing {path}: {e}")
    
    print(f"Done. Fixed {fixed_count} files.")

if __name__ == "__main__":
    fix_null_bytes("app")
