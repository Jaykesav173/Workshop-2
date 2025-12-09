"""
Script to check and verify user password in database
Run this to verify if a user's password is correctly stored
"""
import bcrypt
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import get_db

def check_user_password(username, test_password):
    """Check if a password matches for a user"""
    try:
        db = get_db()
        
        # Get user from database
        # Try different table name formats (Supabase can be case-sensitive)
        print(f"🔍 Searching for user: {username}")
        print(f"   Trying table 'User'...")
        
        res = db.table("User").select(
            "id, username, hashed_password, role, \"Account_status\""
        ).eq("username", username).execute()
        
        # Debug output
        print(f"   Query returned: {len(res.data) if res.data else 0} results")
        if res.data:
            print(f"   Found user data keys: {list(res.data[0].keys())}")
        
        # If not found, try lowercase
        if not res.data:
            print(f"   Trying table 'user' (lowercase)...")
            res = db.table("user").select(
                "id, username, hashed_password, role, \"Account_status\""
            ).eq("username", username).execute()
            print(f"   Query returned: {len(res.data) if res.data else 0} results")
        
        if not res.data:
            print(f"❌ User '{username}' not found in database!")
            return False
        
        user = res.data[0]
        stored_hash = user["hashed_password"]
        
        print(f"✅ User found: {username}")
        print(f"   ID: {user['id']}")
        print(f"   Role: {user.get('role', 'N/A')}")
        print(f"   Account Status: {user.get('Account_status', 'N/A')}")
        print(f"   Password Hash (first 20 chars): {stored_hash[:20]}...")
        print()
        
        # Try to verify password
        try:
            # Check if password matches
            if bcrypt.checkpw(
                test_password.encode("utf-8"),
                stored_hash.encode("utf-8")
            ):
                print("✅ Password is CORRECT!")
                return True
            else:
                print("❌ Password is INCORRECT!")
                print(f"   Test password: '{test_password}'")
                print(f"   Stored hash doesn't match this password.")
                return False
        except Exception as e:
            print(f"❌ Error checking password: {str(e)}")
            print(f"   This might indicate the password hash is corrupted or in wrong format.")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def reset_user_password(username, new_password):
    """Reset a user's password"""
    try:
        db = get_db()
        
        print(f"🔍 Finding user: {username}")
        
        # Get user - try to get all fields first to debug
        res = db.table("User").select("*").eq("username", username).execute()
        
        print(f"   Query result: {len(res.data) if res.data else 0} users found")
        
        if not res.data:
            print(f"❌ User '{username}' not found!")
            print(f"   Note: This might be due to RLS blocking access.")
            print(f"   Make sure RLS policies allow SELECT on User table.")
            return False
        
        user_id = res.data[0]["id"]
        
        # Hash new password
        hashed_pw = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        
        # Update password
        update_res = db.table("User").update({
            "hashed_password": hashed_pw,
            "temp_password": False
        }).eq("id", user_id).execute()
        
        if update_res.data:
            print(f"✅ Password reset successfully for user '{username}'!")
            print(f"   New password: '{new_password}'")
            return True
        else:
            print("❌ Failed to update password")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Check or reset user password")
    parser.add_argument("username", help="Username to check/reset")
    parser.add_argument("--check", help="Password to check", default=None)
    parser.add_argument("--reset", help="New password to set", default=None)
    
    args = parser.parse_args()
    
    if args.reset:
        print(f"Resetting password for user: {args.username}")
        print("=" * 50)
        reset_user_password(args.username, args.reset)
    elif args.check:
        print(f"Checking password for user: {args.username}")
        print("=" * 50)
        check_user_password(args.username, args.check)
    else:
        print("Usage:")
        print(f"  Check password: python check_user_password.py {args.username} --check <password>")
        print(f"  Reset password: python check_user_password.py {args.username} --reset <new_password>")

