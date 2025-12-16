"""
Test password verification for user asillah
"""
import sys
sys.path.insert(0, '.')

import bcrypt
from app.database.connection import get_db

print("=" * 60)
print("Password Verification Test")
print("=" * 60)

db = get_db()
username = "asillah"
test_password = "asillah"

try:
    # Get user
    res = db.table("User").select("hashed_password").eq("username", username).execute()
    
    if not res.data:
        print(f"❌ User '{username}' not found")
        sys.exit(1)
    
    user = res.data[0]
    stored_hash = user['hashed_password']
    
    print(f"\nUser: {username}")
    print(f"Stored Hash: {stored_hash[:50]}...")
    print(f"\nTesting password: '{test_password}'")
    
    # Verify password
    password_bytes = test_password.encode("utf-8")
    hash_bytes = stored_hash.encode("utf-8")
    
    is_valid = bcrypt.checkpw(password_bytes, hash_bytes)
    
    if is_valid:
        print(f"\n✅ PASSWORD MATCHES! Login should work!")
        print(f"\n💡 The login issue might be:")
        print(f"   1. Backend server needs restart to pick up new SERVICE_ROLE key")
        print(f"   2. Check backend terminal for errors")
    else:
        print(f"\n❌ PASSWORD DOES NOT MATCH!")
        print(f"   The password '{test_password}' is NOT correct")
        print(f"   You need to reset the password")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)

