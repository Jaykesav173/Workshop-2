import uuid
import json
from typing import List
from datetime import datetime
from PIL import Image
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Internal Imports
from app.ai_models.defect_detector import analyze_defect_image # Updated import
from app.database.models import Photo  # Ensure this matches your models.py
from app.database.database import get_db 
from app.database.connection import supabase # Ensure these match your config
from app.config import settings

router = APIRouter(
    prefix="/ai_photo",
    tags=["AI Photo Analysis"]
)

# ===========================
# SCHEMAS (Pydantic)
# ===========================
class ValidationResult(BaseModel):
    isValid: bool
    checks: dict

# ===========================
# UTILITY FUNCTIONS
# ===========================
def validate_photo(file: UploadFile) -> ValidationResult:
    valid_formats = ["image/jpeg", "image/png", "image/webp"]
    format_ok = file.content_type in valid_formats

    try:
        file.file.seek(0) 
        img = Image.open(file.file)
        width, height = img.size
        # Standards for maritime inspection photos
        dimension_ok = 200 <= width <= 4000 and 200 <= height <= 4000
        file_size_ok = True
        file.file.seek(0) 
    except Exception as e:
        dimension_ok, width, height, file_size_ok = False, 0, 0, False

    checks = {
        "fileType": {"passed": format_ok},
        "dimensions": {"passed": dimension_ok, "message": f"{width}x{height}"},
        "fileSize": {"passed": file_size_ok},
        "content": {"passed": True},
    }
    return ValidationResult(isValid=all(c["passed"] for c in checks.values()), checks=checks)

async def upload_to_supabase(file: UploadFile):
    contents = await file.read()
    file_ext = file.filename.split(".")[-1]
    file_path = f"photos/{uuid.uuid4()}.{file_ext}"
    
    try:
        supabase.storage.from_("photos").upload(
            file_path, contents, {"content-type": file.content_type}
        )
        public_url = supabase.storage.from_("photos").get_public_url(file_path)
        return file_path, public_url, len(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase Upload failed: {str(e)}")

# ===========================
# ENDPOINTS
# ===========================

from app.dependencies import get_current_user

# ... (existing imports)

# ===========================
# ENDPOINTS
# ===========================

class PhotoResponse(BaseModel):
    id: int
    file_path: str
    storage_url: str
    file_name: str
    ai_description: str
    ai_recommendation: str
    category: str = None
    severity: str = None
    uploaded_at: datetime = None

    class Config:
        from_attributes = True

def debug_log(message):
    with open("c:/Users/HP/Workshop2-asillah/backend/debug_ai_photo.log", "a") as f:
        f.write(f"{datetime.now()}: {message}\n")

@router.get("/my_defects", response_model=List[PhotoResponse])
def get_my_defects(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get all defects uploaded/saved by the current user"""
    debug_log(f"current_user object: {current_user}")
    user_id = current_user.get("id")
    debug_log(f"Fetching defects for user_id={user_id} (type: {type(user_id)})")
    
    if user_id is not None:
        try:
            user_id = int(str(user_id))
        except:
            pass
            
    photos = db.query(Photo).filter(Photo.uploaded_by == user_id).order_by(Photo.uploaded_at.desc()).all()
    debug_log(f"Found {len(photos)} photos for user_id={user_id}")
    return photos

@router.post("/analyze")
async def analyze_photos(files: List[UploadFile] = File(...)):
    """STEP 1: Upload photos for temporary AI analysis (not saved to DB yet)"""
    results = []
    for file in files:
        validation = validate_photo(file)
        if not validation.isValid:
            results.append({"filename": file.filename, "error": "Invalid Image", "details": validation.checks})
            continue
        
        await file.seek(0)
        img_content = await file.read()
        ai_result = await analyze_defect_image(img_content)
        
        results.append({
            "filename": file.filename,
            "ai_findings": ai_result
        })
    return {"results": results}



# SAVE PHOTO AND AI RESULTS TO DATABASE

@router.post("/confirm")
async def confirm_save(
    ai_description: str = Form(...),
    ai_recommendation: str = Form(...),
    category: str = Form(...),
    severity: str = Form(...),
    box_2d: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user) # Add Auth Dependency
):
    # import json
    # # Convert string "[100, 200, ...]" back to a list
    # box_list = json.loads(box_2d)

    """STEP 2: Persist the confirmed defect using the generated Photo ID"""
    await file.seek(0)
    file_path, public_url, file_size = await upload_to_supabase(file)
    
    debug_log(f"confirm_save current_user object: {current_user}")
    user_id = current_user.get("id")
    debug_log(f"Saving defect for user_id={user_id} (type: {type(user_id)})")
    
    if user_id is not None:
        try:
            user_id = int(str(user_id))
        except:
            pass

    # We create the record. PostgreSQL/Supabase will automatically 
    # generate the 'id' (Photo ID).
    new_photo = Photo(
        file_path=file_path,
        file_name=file.filename,
        file_size=file_size,
        storage_url=public_url,
        ai_description=ai_description,
        ai_recommendation=ai_recommendation,
        category=category,
        severity=severity,
        box_2d=box_2d,
        # Set these to 0 or allow null if your model.py permits
        equipment_id=None, 
        uploaded_by=user_id # Link to user
    )
    
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)
    
    return {
        "message": "Defect saved",
        "photo_id": new_photo.id, # This is the unique ID identifying this detection
        "storage_url": new_photo.storage_url
    } 