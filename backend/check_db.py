
from app.database.database import SessionLocal
from app.database.models import Photo, User
import json

db = SessionLocal()
try:
    print("--- PHOTO TABLE CHECK ---")
    photos = db.query(Photo).order_by(Photo.uploaded_at.desc()).limit(5).all()
    for p in photos:
        print(f"ID: {p.id} | File: {p.file_name} | UploadedBy: {p.uploaded_by} | Time: {p.uploaded_at}")
    
    print("\n--- USER TABLE CHECK ---")
    users = db.query(User).limit(5).all()
    for u in users:
        print(f"ID: {u.id} | Username: {u.username} | Role: {u.role}")

finally:
    db.close()
