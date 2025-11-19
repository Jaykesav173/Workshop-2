"""
Detailed database check - find the issue
"""
import sys
sys.path.insert(0, '.')

print("=" * 60)
print("Detailed Database Check")
print("=" * 60)

try:
    from app.database.connection import get_db
    from app.config import settings
    
    print("\n1. Configuration Check...")
    print(f"   SUPABASE_URL: {settings.SUPABASE_URL}")
    print(f"   SUPABASE_KEY: {settings.SUPABASE_KEY[:30]}...")
    
    print("\n2. Database Connection...")
    db = get_db()
    print("✅ Connected to Supabase")
    
    print("\n3. Testing different table name variations...")
    
    # Try different table name variations
    table_names = ["User", "user", "users", "Users"]
    
    for table_name in table_names:
        try:
            print(f"\n   Trying table: '{table_name}'...")
            result = db.table(table_name).select("*").limit(1).execute()
            if result.data:
                print(f"   ✅ Table '{table_name}' exists and has data!")
                print(f"   First record keys: {list(result.data[0].keys())}")
                
                # Now try to get all users
                all_users = db.table(table_name).select("*").execute()
                print(f"   Total records: {len(all_users.data)}")
                
                if all_users.data:
                    print(f"\n   First 5 users:")
                    for i, user in enumerate(all_users.data[:5], 1):
                        username = user.get('username') or user.get('Username') or 'N/A'
                        print(f"     {i}. {username}")
                    
                    # Check for 'asillah'
                    asillah_found = False
                    for user in all_users.data:
                        username = user.get('username') or user.get('Username') or ''
                        if username.lower() == 'asillah':
                            asillah_found = True
                            print(f"\n   ✅ Found user 'asillah'!")
                            print(f"      ID: {user.get('id')}")
                            print(f"      Username: {user.get('username') or user.get('Username')}")
                            print(f"      Email: {user.get('email') or user.get('Email')}")
                            print(f"      Role: {user.get('role') or user.get('Role')}")
                            print(f"      Status: {user.get('Account_status') or user.get('account_status')}")
                            break
                    
                    if not asillah_found:
                        print(f"\n   ❌ User 'asillah' not found in table '{table_name}'")
                        
                break
            else:
                print(f"   ⚠️  Table '{table_name}' exists but is empty")
        except Exception as e:
            print(f"   ❌ Table '{table_name}' - Error: {str(e)[:100]}")
    
    # Also try listing all tables if possible
    print("\n4. Attempting to query with username filter...")
    try:
        for table_name in ["User", "user", "users"]:
            try:
                res = db.table(table_name).select("*").eq("username", "asillah").execute()
                if res.data:
                    print(f"   ✅ Found 'asillah' in table '{table_name}'")
                    user = res.data[0]
                    print(f"      Full record: {user}")
                    break
            except:
                pass
    except Exception as e:
        print(f"   Error: {e}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)

