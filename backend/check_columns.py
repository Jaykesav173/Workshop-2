from database import supabase
import json

try:
    # Try to insert a dummy row to get an error with column names, or just select
    # Since table might be empty, select might return empty list.
    # But let's try to select * from equipment limit 1
    res = supabase.table("equipment").select("*").limit(1).execute()
    if res.data:
        print("Columns found:")
        for col in res.data[0].keys():
            print(col)
    else:
        # If empty, we can't easily get columns via select *.
        # We can try to insert an invalid column and see the error message, 
        # but supabase-py might not return the full schema in error.
        # Let's try to inspect the 'type' table as well since we need it.
        print("Equipment table is empty.")
        
        # Alternative: Try to select a specific column we are unsure about.
        # If it fails, we know it doesn't exist.
        try:
            supabase.table("equipment").select("equipment_tag").limit(1).execute()
            print("Column 'equipment_tag' exists.")
        except Exception as e:
            print("Column 'equipment_tag' error:", e)

        try:
            supabase.table("equipment").select("equipment_tag_no").limit(1).execute()
            print("Column 'equipment_tag_no' exists.")
        except Exception as e:
            print("Column 'equipment_tag_no' error:", e)

except Exception as e:
    print("Error:", e)
