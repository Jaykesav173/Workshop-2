import requests
import sys

BASE_URL = "http://localhost:8000/api"

def test_dashboard_apis():
    # 1. Login to get token
    # Try admin first
    login_credentials = [
        {"username": "admin", "password": "password123"},
        {"username": "inspector", "password": "password123"},
        {"username": "asillah", "password": "asillah"},
        {"username": "admin@example.com", "password": "password123"} # Try email as username just in case
    ]
    
    token = None
    
    print("Attempting login...")
    for creds in login_credentials:
        print(f"  Trying {creds['username']}...")
        r = requests.post(f"{BASE_URL}/auth/login", json=creds)
        if r.status_code == 200:
            token = r.json().get("access_token")
            print(f"  Login successful as {creds['username']}")
            break
        else:
            print(f"  Failed: {r.status_code} {r.text}")

    if not token:
        print("All login attempts failed.")
        return

    headers = {"Authorization": f"Bearer {token}"}
        
    # 2. Test /reports/summary
    print("\nTesting /reports/summary...")
    r = requests.get(f"{BASE_URL}/reports/summary", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.json()}")
    
    # 3. Test /activity/reports
    print("\nTesting /activity/reports...")
    r = requests.get(f"{BASE_URL}/activity/reports", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.json()}")

    # 4. Test Inspector Dashboard Endpoints (mock user_id=1)
    print("\nTesting Inspector endpoints (user_id=1)...")
    endpoints = [
        "/dashboard/user_summary/1",
        "/dashboard/reports_by_status/1",
        "/dashboard/reports_trend/1",
        "/dashboard/recent_activity/1"
    ]
    for ep in endpoints:
        print(f"  Testing {ep}...")
        r = requests.get(f"{BASE_URL}{ep}", headers=headers)
        print(f"  Status: {r.status_code}")

    # 5. Test User Management Endpoint (Admin only)
    print("\nTesting /users endpoint...")
    r = requests.get(f"{BASE_URL}/users", headers=headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        users = r.json()
        print(f"Response success: {users.get('success')}")
        print(f"User count: {len(users.get('users', []))}")
    else:
        print(f"Response: {r.text}")

if __name__ == "__main__":
    test_dashboard_apis()
