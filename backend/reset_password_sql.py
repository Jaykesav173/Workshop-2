"""
Generate SQL to reset user password in Supabase
This generates the bcrypt hash that you can use in Supabase SQL editor
"""
import bcrypt

def generate_password_hash(password):
    """Generate bcrypt hash for a password"""
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    return hashed

if __name__ == "__main__":
    username = "asillah"
    new_password = "asillah"
    
    hashed_password = generate_password_hash(new_password)
    
    print("=" * 70)
    print("Password Reset SQL for Supabase")
    print("=" * 70)
    print()
    print(f"Username: {username}")
    print(f"New Password: {new_password}")
    print()
    print("Copy and paste this SQL into Supabase SQL Editor:")
    print()
    print("-" * 70)
    print(f"UPDATE \"User\"")
    print(f"SET hashed_password = '{hashed_password}',")
    print(f"    temp_password = false")
    print(f"WHERE username = '{username}';")
    print("-" * 70)
    print()
    print("After running this SQL:")
    print("1. Restart your backend server (if needed)")
    print(f"2. Try logging in with username: {username}, password: {new_password}")
    print()


