"""
Check database connection and verify user exists
"""
import sys
import os
sys.path.insert(0, '.')

print("=" * 60)
print("Database Connection & User Check")
print("=" * 60)

# Test 1: Database Connection
print("\n1. Testing Database Connection...")
try:
    from app.database.connection import get_db
    db = get_db()
    print("✅ Database connection object created")
    
    # Try to query the User table
    test_query = db.table("User").select("count").execute()
    print("✅ Successfully connected to Supabase database")
    print(f"   Database URL: Connected (from config)")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 2: Check if User table exists and has data
print("\n2. Checking User Table...")
try:
    all_users = db.table("User").select("id, username, \"Account_status\"").execute()
    
    if not all_users.data:
        print("⚠️  User table is EMPTY - no users found")
    else:
        print(f"✅ User table has {len(all_users.data)} user(s)")
        print("\n   All users in database:")
        for user in all_users.data:
            print(f"     - ID: {user.get('id')}, Username: {user.get('username')}, Status: {user.get('Account_status')}")
except Exception as e:
    print(f"❌ Error querying User table: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Check specific user "asillah"
print("\n3. Checking for user 'asillah'...")
try:
    username = "asillah"
    res = db.table("User").select(
        "id, username, email, role, \"Account_status\", hashed_password"
    ).eq("username", username).execute()
    
    if not res.data:
        print(f"❌ User '{username}' NOT FOUND in database")
        print(f"\n   Available usernames:")
        if all_users.data:
            for u in all_users.data:
                print(f"     - {u.get('username')}")
        else:
            print("     (No users in database)")
    else:
        user = res.data[0]
        print(f"✅ User '{username}' FOUND!")
        print(f"\n   User Details:")
        print(f"     ID: {user.get('id')}")
        print(f"     Username: {user.get('username')}")
        print(f"     Email: {user.get('email')}")
        print(f"     Role: {user.get('role')}")
        print(f"     Account Status: {user.get('Account_status')}")
        
        hashed_pw = user.get('hashed_password', '')
        if hashed_pw:
            print(f"     Password Hash: {hashed_pw[:50]}...")
            print(f"     Hash Length: {len(hashed_pw)} characters")
            print(f"     Hash Format: {'Valid bcrypt' if hashed_pw.startswith('$2') else 'Unknown format'}")
        else:
            print(f"     ⚠️  Password Hash: MISSING!")
            
        # Check account status
        if user.get('Account_status') != 'ACTIVE':
            print(f"\n   ⚠️  WARNING: Account status is '{user.get('Account_status')}' - should be 'ACTIVE' for login")
        else:
            print(f"\n   ✅ Account status is ACTIVE - login should work if password matches")
            
except Exception as e:
    print(f"❌ Error checking user: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Check Complete")
print("=" * 60)

