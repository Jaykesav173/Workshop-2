
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("--- RECENT PHOTOS ---")
    result = conn.execute(text("SELECT id, file_name, uploaded_by, uploaded_at FROM \"Photo\" ORDER BY uploaded_at DESC LIMIT 5"))
    for row in result:
        print(row)
    
    print("\n--- RECENT USERS ---")
    result = conn.execute(text("SELECT id, username, role FROM \"User\" LIMIT 5"))
    for row in result:
        print(row)
