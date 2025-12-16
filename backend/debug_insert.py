from database import supabase
from datetime import datetime

def test_insert():
    print("Testing insert...")
    try:
        data = {
            "equipment_tag_no": "TEST-TAG-999",
            "equipment_description": "Test Description",
            "type_id": 11001, # Assuming this ID exists from previous check
            "material": "Carbon Steel",
            "location": "Test Area",
            "dosh_registration_no": "DOSH-TEST",
            "nominal_thickness": 10.5,
            "corrosion_allowance": 3.0,
            "design_pressure": 15.0,
            "design_temperature": 100.0,
            "status": "ACTIVE",
            "created_at": str(datetime.utcnow()),
            # "inspection_due_date": None # Intentionally omitted/None
        }
        
        res = supabase.table("equipment").insert(data).execute()
        print("Insert successful:", res.data)
    except Exception as e:
        print("Insert failed:", e)

if __name__ == "__main__":
    test_insert()
