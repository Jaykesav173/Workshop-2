from app.database.connection import get_db

def test_material():
    try:
        db = get_db()
        print("Querying 'material' table...")
        res = db.table("material").select("*").execute()
        print(f"Success! Data: {res.data}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_material()
