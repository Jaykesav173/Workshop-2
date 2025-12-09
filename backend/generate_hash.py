import bcrypt

password = "asillah"
hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

print("\n" + "="*70)
print("PASSWORD RESET SQL FOR SUPABASE")
print("="*70)
print(f"\nUsername: {password}")
print(f"New Password: {password}")
print(f"\nCopy this SQL and run it in Supabase SQL Editor:\n")
print("-"*70)
print(f"UPDATE \"User\"")
print(f"SET hashed_password = '{hashed}',")
print(f"    temp_password = false")
print(f"WHERE username = 'asillah';")
print("-"*70)
print("\nAfter running the SQL, try logging in again!\n")

