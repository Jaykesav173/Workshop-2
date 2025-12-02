import sys
import os
from datetime import timedelta

# Ensure we can import from current directory
sys.path.insert(0, os.getcwd())

from app.utils.jwt_utils import create_access_token, verify_token
from app.config import settings

def test_auth_logic():
    print(f"SECRET_KEY: {settings.SECRET_KEY}")
    print(f"ALGORITHM: {settings.ALGORITHM}")

    # 1. Create Token
    data = {"sub": "testuser", "id": 1, "role": "USER"}
    token = create_access_token(data)
    print(f"\nGenerated Token: {token}")

    # 2. Verify Token
    payload = verify_token(token)
    print(f"Verified Payload: {payload}")

    if payload and payload["sub"] == "testuser":
        print("\n✅ Auth logic is working correctly.")
    else:
        print("\n❌ Auth logic failed.")

if __name__ == "__main__":
    test_auth_logic()
