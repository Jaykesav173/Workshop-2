"""
List all users in the database to see what usernames exist
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import get_db

def list_all_users():
    """List all users in the database"""
    try:
        db = get_db()
        
        print("\n🔍 Listing all users in database...")
        print("=" * 60)
        
        # Try "User" table
        try:
            res = db.table("User").select("id, username, role, \"Account_status\"").execute()
            if res.data:
                print(f"\n✅ Found {len(res.data)} user(s) in 'User' table:")
                for user in res.data:
                    username = user.get('username', 'N/A')
                    print(f"   - ID: {user.get('id')}, Username: '{username}' (length: {len(username)}), Role: {user.get('role')}, Status: {user.get('Account_status')}")
                    # Show if there are any spaces
                    if username != username.strip():
                        print(f"     ⚠️  WARNING: Username has leading/trailing spaces!")
            else:
                print("\n❌ No users found in 'User' table")
        except Exception as e:
            print(f"\n❌ Error querying 'User' table: {str(e)}")
        
        # Try "user" table (lowercase)
        try:
            res = db.table("user").select("id, username, role, \"Account_status\"").execute()
            if res.data:
                print(f"\n✅ Found {len(res.data)} user(s) in 'user' table:")
                for user in res.data:
                    username = user.get('username', 'N/A')
                    print(f"   - ID: {user.get('id')}, Username: '{username}' (length: {len(username)}), Role: {user.get('role')}, Status: {user.get('Account_status')}")
                    # Show if there are any spaces
                    if username != username.strip():
                        print(f"     ⚠️  WARNING: Username has leading/trailing spaces!")
            else:
                print("\n❌ No users found in 'user' table")
        except Exception as e:
            print(f"\n❌ Error querying 'user' table: {str(e)}")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    list_all_users()


