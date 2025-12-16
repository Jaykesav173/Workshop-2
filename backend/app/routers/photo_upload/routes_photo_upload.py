"""
Photo Upload Routes - Asillah (Module 1)
API endpoints for uploading inspection photos
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import FileResponse
from app.routers.photo_upload.service_photo_upload import PhotoUploadService
from app.dependencies import get_current_user, get_optional_user
from typing import Optional
import os

router = APIRouter(prefix="/photos", tags=["Photo Upload"])

photo_upload_service = PhotoUploadService()

@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    equipment_id: Optional[int] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload inspection photo (equipment_id is optional - can link to equipment or upload standalone)"""
    return await photo_upload_service.upload_photo(file, equipment_id, current_user)

# IMPORTANT: More specific routes must come BEFORE parameterized routes
@router.get("/equipment/{equipment_id}")
async def get_equipment_photos(
    equipment_id: int,
    current_user = Depends(get_optional_user)
):
    """Get all photos for an equipment (public read for testing)"""
    return await photo_upload_service.get_equipment_photos(equipment_id)

@router.get("/{photo_id}/file")
async def get_photo_file(
    photo_id: int,
    current_user = Depends(get_optional_user)
):
    """Serve photo file (public read for testing)"""
    from fastapi.responses import Response
    photo = await photo_upload_service.get_photo(photo_id)
    file_path = photo.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Photo file not found")
    
    # Read file and return with CORS headers
    with open(file_path, "rb") as f:
        content = f.read()
    
    # Determine media type from file extension
    import mimetypes
    media_type, _ = mimetypes.guess_type(file_path)
    if not media_type:
        media_type = "image/jpeg"  # Default to JPEG
    
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.get("/{photo_id}")
async def get_photo(
    photo_id: int,
    current_user = Depends(get_optional_user)
):
    """Get photo by ID (public read for testing)"""
    return await photo_upload_service.get_photo(photo_id)

@router.delete("/{photo_id}")
async def delete_photo(photo_id: int, current_user: dict = Depends(get_current_user)):
    """Delete photo"""
    return await photo_upload_service.delete_photo(photo_id)

