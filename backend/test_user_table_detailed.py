"""
Detailed test to check User table - including RLS and permissions
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import get_db

def test_user_table_detailed():
    """Detailed test of User table access"""
    print("\n" + "="*70)
    print("DETAILED USER TABLE TEST")
    print("="*70)
    
    try:
        db = get_db()
        
        # Test 1: Count all users
        print("\n1️⃣  Counting total users...")
        try:
            res = db.table("User").select("id", count="exact").execute()
            print(f"   Total users in table: {res.count if hasattr(res, 'count') else 'Unknown'}")
        except Exception as e:
            print(f"   Error: {str(e)}")
        
        # Test 2: Try to get all columns
        print("\n2️⃣  Fetching all users with all columns...")
        try:
            res = db.table("User").select("*").execute()
            print(f"   Query executed successfully")
            print(f"   Data returned: {len(res.data) if res.data else 0} row(s)")
            
            if res.data:
                print(f"\n   Users found:")
                for idx, user in enumerate(res.data, 1):
                    print(f"   {idx}. ID: {user.get('id')}")
                    print(f"      Username: '{user.get('username')}'")
                    print(f"      Email: {user.get('email')}")
                    print(f"      Role: {user.get('role')}")
                    print(f"      Status: {user.get('Account_status')}")
                    print(f"      Has password: {'Yes' if user.get('hashed_password') else 'No'}")
            else:
                print("\n   ⚠️  No data returned - possible reasons:")
                print("      - Table is empty")
                print("      - Row Level Security (RLS) is blocking access")
                print("      - Service role key doesn't have permissions")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            print(f"   Error details: {type(e).__name__}")
        
        # Test 3: Try with specific columns
        print("\n3️⃣  Fetching users with specific columns...")
        try:
            res = db.table("User").select("id, username, role").execute()
            if res.data:
                print(f"   ✅ Found {len(res.data)} user(s):")
                for user in res.data:
                    print(f"      - {user.get('username')} (ID: {user.get('id')}, Role: {user.get('role')})")
            else:
                print("   ⚠️  No users returned")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Test 4: Try to find specific user
        print("\n4️⃣  Searching for user 'asillah'...")
        try:
            res = db.table("User").select("*").eq("username", "asillah").execute()
            if res.data:
                user = res.data[0]
                print(f"   ✅ User found:")
                print(f"      ID: {user.get('id')}")
                print(f"      Username: '{user.get('username')}'")
                print(f"      Email: {user.get('email')}")
                print(f"      Role: {user.get('role')}")
                print(f"      Status: {user.get('Account_status')}")
                print(f"      Password hash exists: {'Yes' if user.get('hashed_password') else 'No'}")
                if user.get('hashed_password'):
                    hash_val = user.get('hashed_password')
                    if isinstance(hash_val, bytes):
                        hash_val = hash_val.decode('utf-8')
                    print(f"      Hash length: {len(hash_val)}")
                    print(f"      Hash starts with: {hash_val[:7]}")
            else:
                print("   ❌ User 'asillah' not found")
                print("\n   💡 Possible reasons:")
                print("      - User doesn't exist")
                print("      - Username is different (case-sensitive?)")
                print("      - RLS is blocking the query")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        # Test 5: List all usernames (if any)
        print("\n5️⃣  Listing all usernames in database...")
        try:
            res = db.table("User").select("username").execute()
            if res.data:
                usernames = [u.get('username') for u in res.data if u.get('username')]
                print(f"   Found {len(usernames)} username(s):")
                for username in usernames:
                    print(f"      - '{username}'")
            else:
                print("   ⚠️  No usernames found")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print("\n" + "="*70)
        print("RECOMMENDATIONS:")
        print("="*70)
        print("1. If no data is returned, check:")
        print("   - Is the table empty in Supabase?")
        print("   - Is RLS enabled? (Check Supabase dashboard)")
        print("   - Does the service role key have proper permissions?")
        print("\n2. If user 'asillah' is not found:")
        print("   - Check the exact username in Supabase dashboard")
        print("   - Username is case-sensitive")
        print("   - Check for leading/trailing spaces")
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_user_table_detailed()


