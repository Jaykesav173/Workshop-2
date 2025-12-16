"""
Check if RLS is blocking queries or if we need service role key
"""
import sys
sys.path.insert(0, '.')

print("=" * 60)
print("RLS & Permissions Check")
print("=" * 60)

from app.database.connection import get_db
from app.config import settings
from supabase import create_client

print("\n1. Current API Key Type Check...")
current_key = settings.SUPABASE_KEY
print(f"   Key starts with: {current_key[:50]}...")

# Check if it's anon key or service role key by trying to decode JWT
try:
    import base64
    import json
    
    # JWT has 3 parts: header.payload.signature
    parts = current_key.split('.')
    if len(parts) >= 2:
        # Decode payload (second part)
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload)
        jwt_data = json.loads(decoded)
        
        print(f"   JWT Role: {jwt_data.get('role', 'unknown')}")
        if jwt_data.get('role') == 'anon':
            print(f"   ⚠️  Using ANON key - might be blocked by RLS!")
            print(f"   💡 Need SERVICE_ROLE key to bypass RLS")
        elif jwt_data.get('role') == 'service_role':
            print(f"   ✅ Using SERVICE_ROLE key - should bypass RLS")
        else:
            print(f"   ⚠️  Unknown role type")
except Exception as e:
    print(f"   Could not decode JWT: {e}")

print("\n2. Testing with current key (ANON)...")
try:
    db = get_db()
    result = db.table("User").select("*").limit(5).execute()
    
    if result.data:
        print(f"   ✅ Query successful - found {len(result.data)} records")
        print(f"   First user: {result.data[0].get('username', 'N/A')}")
    else:
        print(f"   ⚠️  Query returned empty (likely RLS blocking)")
        print(f"   Table exists but RLS is preventing access")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n3. Recommendation...")
print("   If you see data in Supabase dashboard but not in queries:")
print("   1. Either disable RLS on 'User' table (for testing)")
print("   2. Or use SERVICE_ROLE key instead of ANON key")
print("   3. Or create RLS policies to allow reads")

print("\n" + "=" * 60)
print("To check in Supabase Dashboard:")
print("1. Go to Table Editor -> User")
print("2. See if data appears there")
print("3. Go to Authentication -> Policies")
print("4. Check if RLS is enabled on User table")
print("=" * 60)

