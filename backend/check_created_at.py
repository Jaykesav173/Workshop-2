from database import supabase

try:
    # Try to select created_at from one record
    res = supabase.table("equipment").select("created_at").limit(1).execute()
    print("Column 'created_at' exists. Data:", res.data)
except Exception as e:
    print("Error selecting 'created_at':", e)
