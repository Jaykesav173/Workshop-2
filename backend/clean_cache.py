import shutil
import os

def clean_pycache(path):
    for root, dirs, files in os.walk(path):
        if "__pycache__" in dirs:
            pycache_path = os.path.join(root, "__pycache__")
            print(f"Removing {pycache_path}")
            try:
                shutil.rmtree(pycache_path)
            except Exception as e:
                print(f"Error removing {pycache_path}: {e}")

clean_pycache("app")
print("Cleaned pycache")
