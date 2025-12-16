import requests
import sys

BASE_URL = "http://localhost:8000/api"

def test_get_equipment():
    # 1. Login
    print("1. Logging in...")
    try:
        resp = requests.post(f"{BASE_URL}/login", json={"username": "asillah", "password": "password123"})
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return
        
        token = resp.json()["access_token"]
        print("Login successful. Token obtained.")
    except Exception as e:
        print(f"Login error: {e}")
        return

    # 2. Get Equipment
    print("\n2. Fetching Equipment...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/equipment", headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"Success! Found {len(data)} items.")
            if len(data) > 0:
                print("First item:", data[0])
        else:
            print(f"Fetch failed: {resp.status_code} {resp.text}")
            
    except Exception as e:
        print(f"Fetch error: {e}")

if __name__ == "__main__":
    test_get_equipment()
