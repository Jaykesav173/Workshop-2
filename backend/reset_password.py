import bcrypt
from database import supabase

username = "asillah"
new_password = "password123"

hashed_pw = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

try:
    res = supabase.table("User").update({"hashed_password": hashed_pw}).eq("username", username).execute()
    print("Password updated:", res.data)
except Exception as e:
    print("Error:", e)
