from typing import Any

def get_available_inspectors(db: Any):
    # This filters your User table specifically for the INSPECTOR role
    # Using Supabase Client syntax
    # Note: 'User' table usually requires quotes or public schema if case sensitive
    try:
        res = db.table("User").select("id, username, role, email").eq("role", "INSPECTOR").execute()
        return res.data
    except Exception as e:
        print(f"Error fetching inspectors: {e}")
        return []