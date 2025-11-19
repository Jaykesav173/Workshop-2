"""
Test script to debug login issue
"""
import sys
import os
sys.path.insert(0, '.')

import bcrypt
from app.database.connection import get_db

# Get database connection
db = get_db()

# Check if user exists
username = "asillah"
print(f"Checking user: {username}")

try:
    res = db.table("User").select(
        "id, username, hashed_password, role, \"Account_status\""
    ).eq("username", username).execute()
    
    if not res.data:
        print(f"❌ User '{username}' NOT FOUND in database")
        print("\nAvailable users:")
        all_users = db.table("User").select("username, \"Account_status\"").execute()
        if all_users.data:
            for u in all_users.data:
                print(f"  - {u['username']} ({u['Account_status']})")
        else:
            print("  No users found in database")
    else:
        user = res.data[0]
        print(f"✅ User found!")
        print(f"   ID: {user['id']}")
        print(f"   Username: {user['username']}")
        print(f"   Role: {user['role']}")
        print(f"   Account Status: {user['Account_status']}")
        print(f"   Password Hash: {user['hashed_password'][:50]}...")
        
        # Test password verification
        test_password = "asillah"
        stored_hash = user['hashed_password']
        
        print(f"\n🔍 Testing password verification...")
        print(f"   Input password: '{test_password}'")
        
        try:
            # Try direct check
            is_valid = bcrypt.checkpw(
                test_password.encode("utf-8"),
                stored_hash.encode("utf-8")
            )
            
            if is_valid:
                print(f"✅ Password VERIFIED - login should work!")
            else:
                print(f"❌ Password verification FAILED")
                print(f"   The password '{test_password}' does NOT match the stored hash")
                print(f"\n   Possible reasons:")
                print(f"   1. Password was changed/hashed differently")
                print(f"   2. There's a typo in the password")
                print(f"   3. Password was manually edited in database")
        except Exception as e:
            print(f"❌ Error during password check: {e}")
            
        # Check if account is active
        if user['Account_status'] != 'ACTIVE':
            print(f"\n⚠️  WARNING: Account status is '{user['Account_status']}' - should be 'ACTIVE'")
            
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

