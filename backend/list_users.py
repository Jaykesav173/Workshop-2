import os
import sys
from app.database.connection import get_db

sys.path.append(os.getcwd())

def list_users():
    db = get_db()
    try:
        res = db.table("users").select("id, username, email, role").limit(5).execute()
        print("Users found:")
        for user in res.data:
            print(f"ID: {user['id']}, Name: {user['username']}, Role: {user['role']}, Email: {user['email']}")
    except Exception as e:
        print(f"Error listing users: {e}")

if __name__ == "__main__":
    list_users()
