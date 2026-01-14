import asyncio
from app.database.connection import get_db

async def debug_schema():
    db = get_db()
    
    # Try inserting a dummy row with material_id to see if it fails (it will if column doesn't exist)
    # But safer to just list columns if we could.
    # Supabase-py doesn't have a direct "describe table" method easily accessible.
    # We will try to fetch one row and print keys.
    
    print("Fetching ALL equipment...")
    try:
        res = db.table("equipment").select("*").execute()
        if res.data:
            print(f"Found {len(res.data)} equipment records.")
            print("First record keys:", res.data[0].keys())
            for eq in res.data:
                print(f" - ID: {eq.get('id')}, Tag: {eq.get('equipment_tag_no')}, MatID: {eq.get('material_id')}, Status: {eq.get('status')}")
        else:
            print("No equipment records found in table 'equipment'.")
    except Exception as e:
        print(f"Error fetching equipment: {e}")

    print("\nFetching material...")
    try:
        res = db.table("material").select("*").limit(1).execute()
        if res.data:
            print("Material columns:", res.data[0].keys())
    except Exception as e:
        print(f"Error fetching material: {e}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(debug_schema())
