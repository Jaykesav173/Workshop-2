from database import supabase

try:
    res = supabase.table("type").select("*").execute()
    print("Types:", res.data)
except Exception as e:
    print("Error:", e)
