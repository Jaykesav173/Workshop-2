
import sys
import os
from pathlib import Path

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

try:
    from app.config import settings
    print("Successfully imported settings")
except ImportError as e:
    print(f"Error importing settings: {e}")
    sys.exit(1)

from dotenv import load_dotenv

print(f"Current Working Directory: {os.getcwd()}")
env_path = Path("app/.env").absolute()
print(f"Checking for .env at: {env_path}")
print(f"Does it exist? {env_path.exists()}")

if env_path.exists():
    print("Reading .env content (checking for key presence only):")
    try:
        with open(env_path, 'r') as f:
            content = f.read()
            if "OPENAI_API_KEY" in content:
                print("  'OPENAI_API_KEY' string FOUND in .env file")
            else:
                print("  'OPENAI_API_KEY' string NOT FOUND in .env file")
    except Exception as e:
        print(f"  Error reading file: {e}")

print("\n--- Runtime Settings ---")
key = settings.OPENAI_API_KEY
if key:
    print(f"settings.OPENAI_API_KEY: Found (Len: {len(key)})")
else:
    print("settings.OPENAI_API_KEY: Not Found/Empty")

print(f"os.environ.get('OPENAI_API_KEY'): {os.environ.get('OPENAI_API_KEY', 'Not Present')}")
