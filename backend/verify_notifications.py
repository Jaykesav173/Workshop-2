import asyncio
import requests
import json
import os

# We are in backend/ directory now

async def create_test_notification(user_id):
    # Import app modules directly since we are in backend/
    from app.routers.notifications.service_notifications import NotificationService
    service = NotificationService()
    print(f"1. Creating test notification for user {user_id}...")
    # The service methods are async, so we await them
    success = await service.create_notification(
        user_id=user_id,
        type="Test",
        title="Verification Notification",
        message="This is a test notification to verify the system.",
        action_link="/test"
    )
    if success:
        print("✅ Notification created in DB.")
    else:
        print("❌ Failed to create notification in DB.")

def verify_api_endpoints(user_id):
    base_url = "http://localhost:8000/api"
    
    # 2. Test GET API
    print("2. Testing GET /api/notifications/unread/...")
    try:
        resp = requests.get(f"{base_url}/notifications/unread/{user_id}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ GET success. Found {len(data)} notifications.")
            
            if len(data) > 0:
                # Find our test notification
                notif = next((n for n in data if n['type'] == 'Test'), None)
                if notif:
                    notif_id = notif['id']
                    print(f"   Found test notification ID: {notif_id}")
                    
                    # 3. Test MARK READ API
                    print(f"3. Testing PUT /api/notifications/{notif_id}/read...")
                    resp_read = requests.put(f"{base_url}/notifications/{notif_id}/read")
                    if resp_read.status_code == 200:
                         print("✅ PUT success. Notification marked as read.")
                    else:
                         print(f"❌ PUT failed: {resp_read.text}")
                else:
                    print("⚠️ Test notification not found in the list (maybe already read?).")
            else:
                 print("⚠️ No notifications found.")
        else:
             print(f"❌ GET failed: {resp.text}")
    except Exception as e:
        print(f"❌ API Request failed: {e}")

if __name__ == "__main__":
    # Ensure we can import 'app'
    import sys
    sys.path.append(os.getcwd()) # Add current dir (backend/) to path
    
    # Run the async creation part
    test_user_id = 99999
    try:
        asyncio.run(create_test_notification(test_user_id))
        
        # Run the sync API verification part
        verify_api_endpoints(test_user_id)
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
