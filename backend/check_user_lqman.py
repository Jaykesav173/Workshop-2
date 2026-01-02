
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path("c:/Users/HP/Workshop2-asillah/backend/app/.env"))
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("--- SEARCH FOR USER lqman11_ ---")
    result = conn.execute(text("SELECT id, username, role FROM \"User\" WHERE username = 'lqman11_'"))
    for row in result:
        print(row)
    
    print("\n--- ALL USERS ---")
    result = conn.execute(text("SELECT id, username, role FROM \"User\""))
    for row in result:
        print(row)
