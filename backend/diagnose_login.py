"""
Comprehensive login diagnosis script
Checks all possible issues and provides fixes
"""
import sys
import os
import bcrypt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import get_db

def diagnose_login():
    """Diagnose login issues"""
    print("\n" + "="*70)
    print("LOGIN DIAGNOSIS TOOL")
    print("="*70)
    
    try:
        db = get_db()
        
        # 1. Check database connection
        print("\n1️⃣  Checking database connection...")
        try:
            test_query = db.table("User").select("id").limit(1).execute()
            print("   ✅ Database connection successful")
        except Exception as e:
            print(f"   ❌ Database connection failed: {str(e)}")
            return
        
        # 2. List all users
        print("\n2️⃣  Listing all users in database...")
        try:
            res = db.table("User").select("id, username, role, \"Account_status\"").execute()
            if res.data:
                print(f"   ✅ Found {len(res.data)} user(s):")
                for user in res.data:
                    username = user.get('username', 'N/A')
                    print(f"      - ID: {user.get('id')}, Username: '{username}'")
                    print(f"        Role: {user.get('role')}, Status: {user.get('Account_status')}")
                    # Check for whitespace issues
                    if username != username.strip():
                        print(f"        ⚠️  WARNING: Username has leading/trailing spaces!")
                    if username != username.lower() and username.lower() in [u.get('username', '').lower() for u in res.data if u.get('id') != user.get('id')]:
                        print(f"        ⚠️  WARNING: Case-sensitive duplicate detected!")
            else:
                print("   ❌ No users found in database!")
                print("\n   💡 SOLUTION: Create a user using the register endpoint or SQL:")
                print("      INSERT INTO \"User\" (name, email, username, hashed_password, role, \"Account_status\")")
                print("      VALUES ('Test User', 'test@example.com', 'asillah', '<hash>', 'INSPECTOR', 'ACTIVE');")
        except Exception as e:
            print(f"   ❌ Error querying users: {str(e)}")
        
        # 3. Check specific user
        print("\n3️⃣  Checking user 'asillah'...")
        username = "asillah"
        try:
            res = db.table("User").select(
                "id, username, hashed_password, role, \"Account_status\""
            ).eq("username", username).execute()
            
            if res.data:
                user = res.data[0]
                print(f"   ✅ User found:")
                print(f"      ID: {user.get('id')}")
                print(f"      Username: '{user.get('username')}'")
                print(f"      Role: {user.get('role')}")
                print(f"      Status: {user.get('Account_status')}")
                
                # Check password hash
                stored_hash = user.get("hashed_password", "")
                if isinstance(stored_hash, bytes):
                    stored_hash = stored_hash.decode("utf-8")
                stored_hash = stored_hash.strip() if stored_hash else ""
                
                print(f"\n   📝 Password Hash Analysis:")
                print(f"      Hash length: {len(stored_hash)}")
                print(f"      Hash starts with: {stored_hash[:7] if stored_hash else 'None'}")
                
                if not stored_hash:
                    print(f"      ❌ ERROR: Password hash is empty!")
                elif not stored_hash.startswith(('$2a$', '$2b$', '$2y$')):
                    print(f"      ❌ ERROR: Invalid hash format!")
                    print(f"      Hash should start with $2a$, $2b$, or $2y$")
                    print(f"      Current hash preview: {stored_hash[:50]}...")
                else:
                    print(f"      ✅ Hash format is valid")
                
                # Test password
                test_password = "asillah"
                print(f"\n   🔐 Testing password 'asillah'...")
                try:
                    password_bytes = test_password.encode("utf-8")
                    hash_bytes = stored_hash.encode("utf-8")
                    result = bcrypt.checkpw(password_bytes, hash_bytes)
                    
                    if result:
                        print(f"      ✅ Password 'asillah' is CORRECT!")
                    else:
                        print(f"      ❌ Password 'asillah' is INCORRECT!")
                        print(f"\n   💡 SOLUTION: Reset the password using:")
                        print(f"      1. Run: python generate_hash.py")
                        print(f"      2. Copy the SQL output")
                        print(f"      3. Run it in Supabase SQL Editor")
                except ValueError as e:
                    print(f"      ❌ Error checking password: {str(e)}")
                    print(f"      Hash may be corrupted")
            else:
                print(f"   ❌ User '{username}' not found!")
                print(f"\n   💡 SOLUTION: Create the user or check the exact username")
        except Exception as e:
            print(f"   ❌ Error checking user: {str(e)}")
        
        # 4. Generate fix SQL
        print("\n4️⃣  Password Reset SQL (if needed):")
        print("   Run this to generate SQL for password reset:")
        print("   python generate_hash.py")
        print("\n   Or use this template:")
        password = "asillah"
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        print(f"\n   UPDATE \"User\"")
        print(f"   SET hashed_password = '{hashed}',")
        print(f"       temp_password = false")
        print(f"   WHERE username = 'asillah';")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    diagnose_login()

