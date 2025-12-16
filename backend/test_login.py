"""
<<<<<<< HEAD
Test script to verify login credentials directly
"""
import sys
import os
import bcrypt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import get_db

def test_login(username, password):
    """Test login credentials"""
    try:
        db = get_db()
        
        print(f"\n🔍 Testing login for: {username}")
        print("=" * 60)
        
        # Try different table names (case sensitivity)
        print(f"\n🔍 Searching for user in database...")
        res = None
        
        # Try "User" first (capitalized)
        print(f"   Trying table 'User'...")
        res = db.table("User").select(
            "id, username, hashed_password, role, \"Account_status\""
        ).eq("username", username).execute()
        
        if not res.data:
            # Try "user" (lowercase)
            print(f"   Trying table 'user' (lowercase)...")
            res = db.table("user").select(
                "id, username, hashed_password, role, \"Account_status\""
            ).eq("username", username).execute()
        
        if not res.data:
            # List all users to see what exists
            print(f"\n📋 Checking what users exist in database...")
            try:
                all_users = db.table("User").select("username").execute()
                if all_users.data:
                    print(f"   Users in 'User' table: {[u.get('username') for u in all_users.data]}")
                else:
                    print(f"   No users found in 'User' table")
            except:
                pass
            
            try:
                all_users = db.table("user").select("username").execute()
                if all_users.data:
                    print(f"   Users in 'user' table: {[u.get('username') for u in all_users.data]}")
                else:
                    print(f"   No users found in 'user' table")
            except:
                pass
            
            print(f"\n❌ User '{username}' not found in database!")
            print(f"   Make sure the username is exactly: '{username}'")
            print(f"   (Check for extra spaces or case differences)")
            return False
        
        user = res.data[0]
        print(f"✅ User found:")
        print(f"   ID: {user['id']}")
        print(f"   Username: {user['username']}")
        print(f"   Role: {user.get('role', 'N/A')}")
        print(f"   Status: {user.get('Account_status', 'N/A')}")
        
        # Get stored hash
        stored_hash = user["hashed_password"]
        if isinstance(stored_hash, bytes):
            stored_hash = stored_hash.decode("utf-8")
        
        stored_hash = stored_hash.strip() if stored_hash else ""
        
        print(f"\n📝 Password Hash Info:")
        print(f"   Hash length: {len(stored_hash)}")
        print(f"   Hash starts with: {stored_hash[:7] if stored_hash else 'None'}")
        print(f"   Hash preview: {stored_hash[:50]}...")
        
        # Validate hash format
        if not stored_hash or not stored_hash.startswith(('$2a$', '$2b$', '$2y$')):
            print(f"\n❌ ERROR: Invalid hash format!")
            print(f"   Hash should start with $2a$, $2b$, or $2y$")
            return False
        
        # Test password
        print(f"\n🔐 Testing Password:")
        print(f"   Password provided: '{password}'")
        print(f"   Password length: {len(password)}")
        
        try:
            password_bytes = password.encode("utf-8")
            hash_bytes = stored_hash.encode("utf-8")
            
            result = bcrypt.checkpw(password_bytes, hash_bytes)
            
            if result:
                print(f"\n✅ SUCCESS: Password is CORRECT!")
                return True
            else:
                print(f"\n❌ FAILED: Password is INCORRECT!")
                print(f"\n💡 To fix this:")
                print(f"   1. Run: python generate_hash.py")
                print(f"   2. Copy the SQL output")
                print(f"   3. Run it in Supabase SQL Editor")
                return False
                
        except ValueError as e:
            print(f"\n❌ ERROR during password check: {str(e)}")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test login credentials")
    parser.add_argument("username", help="Username to test")
    parser.add_argument("password", help="Password to test")
    
    args = parser.parse_args()
    
    test_login(args.username, args.password)
=======
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
>>>>>>> dev-yijing

