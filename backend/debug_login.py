import asyncio
import sys
import os

# Ensure we can import from current directory
sys.path.insert(0, os.getcwd())

from main import login_user
from app.database.schemas import LoginRequest

async def test():
    print("Testing login...")
    try:
        data = LoginRequest(username="asillah", password="password123")
        res = await login_user(data)
        print("Result:", res)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
