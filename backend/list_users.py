from database import supabase

try:
    res = supabase.table("User").select("id, username, role, \"Account_status\"").execute()
    print("Users:", res.data)
except Exception as e:
    print("Error:", e)
