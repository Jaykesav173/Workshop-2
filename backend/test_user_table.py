"""
Test script to check if User table data can be fetched
Tests different table name formats to see which works
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import get_db

def test_user_table():
    """Test fetching from User table with different formats"""
    print("\n" + "="*70)
    print("TESTING USER TABLE DATA FETCHING")
    print("="*70)
    
    try:
        db = get_db()
        
        # Test 1: Simple table name "User"
        print("\n1️⃣  Testing table('User')...")
        try:
            res = db.table("User").select("id, username, role, \"Account_status\"").limit(5).execute()
            if res.data:
                print(f"   ✅ SUCCESS! Found {len(res.data)} user(s):")
                for user in res.data:
                    print(f"      - ID: {user.get('id')}, Username: '{user.get('username')}', Role: {user.get('role')}")
            else:
                print("   ⚠️  Query succeeded but returned no data")
        except Exception as e:
            print(f"   ❌ FAILED: {str(e)}")
            print(f"   Error type: {type(e).__name__}")
        
        # Test 2: Schema-qualified table name public."User"
        print("\n2️⃣  Testing table('public.\"User\"')...")
        try:
            res = db.table('public."User"').select("id, username, role, \"Account_status\"").limit(5).execute()
            if res.data:
                print(f"   ✅ SUCCESS! Found {len(res.data)} user(s):")
                for user in res.data:
                    print(f"      - ID: {user.get('id')}, Username: '{user.get('username')}', Role: {user.get('role')}")
            else:
                print("   ⚠️  Query succeeded but returned no data")
        except Exception as e:
            print(f"   ❌ FAILED: {str(e)}")
            print(f"   Error type: {type(e).__name__}")
        
        # Test 3: Lowercase table name "user"
        print("\n3️⃣  Testing table('user') (lowercase)...")
        try:
            res = db.table("user").select("id, username, role, \"Account_status\"").limit(5).execute()
            if res.data:
                print(f"   ✅ SUCCESS! Found {len(res.data)} user(s):")
                for user in res.data:
                    print(f"      - ID: {user.get('id')}, Username: '{user.get('username')}', Role: {user.get('role')}")
            else:
                print("   ⚠️  Query succeeded but returned no data")
        except Exception as e:
            print(f"   ❌ FAILED: {str(e)}")
            print(f"   Error type: {type(e).__name__}")
        
        # Test 4: Try to get all table names (if possible)
        print("\n4️⃣  Summary:")
        print("   Check which format above worked (✅ SUCCESS)")
        print("   Use that format in the auth service")
        
        # Test 5: Try fetching specific user by username
        print("\n5️⃣  Testing fetching user 'asillah' by username...")
        test_username = "asillah"
        
        # Try with "User"
        try:
            res = db.table("User").select("id, username, hashed_password, role, \"Account_status\"").eq("username", test_username).execute()
            if res.data:
                user = res.data[0]
                print(f"   ✅ Found with table('User'):")
                print(f"      ID: {user.get('id')}, Username: '{user.get('username')}'")
                print(f"      Role: {user.get('role')}, Status: {user.get('Account_status')}")
                print(f"      Has password hash: {'Yes' if user.get('hashed_password') else 'No'}")
            else:
                print(f"   ⚠️  User '{test_username}' not found with table('User')")
        except Exception as e:
            print(f"   ❌ Error with table('User'): {str(e)}")
        
        # Try with public."User"
        try:
            res = db.table('public."User"').select("id, username, hashed_password, role, \"Account_status\"").eq("username", test_username).execute()
            if res.data:
                user = res.data[0]
                print(f"   ✅ Found with table('public.\"User\"'):")
                print(f"      ID: {user.get('id')}, Username: '{user.get('username')}'")
                print(f"      Role: {user.get('role')}, Status: {user.get('Account_status')}")
                print(f"      Has password hash: {'Yes' if user.get('hashed_password') else 'No'}")
            else:
                print(f"   ⚠️  User '{test_username}' not found with table('public.\"User\"')")
        except Exception as e:
            print(f"   ❌ Error with table('public.\"User\"'): {str(e)}")
        
        print("\n" + "="*70)
        print("TEST COMPLETE")
        print("="*70)
        print("\n💡 Recommendation:")
        print("   Use the table name format that showed ✅ SUCCESS above")
        print("   Update service_auth.py to use that format")
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_user_table()


