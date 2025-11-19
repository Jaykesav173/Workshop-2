"""
Photo Upload Routes - Asillah (Module 1)
API endpoints for uploading inspection photos
"""
from fastapi import APIRouter, UploadFile, File, Depends
from app.routers.photo_upload.service_photo_upload import PhotoUploadService
from app.dependencies import get_current_user

router = APIRouter(prefix="/photos", tags=["Photo Upload"])

photo_upload_service = PhotoUploadService()

@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    equipment_id: int = None,
    current_user: dict = Depends(get_current_user)
):
    """Upload inspection photo"""
    return await photo_upload_service.upload_photo(file, equipment_id, current_user)

@router.get("/{photo_id}")
async def get_photo(photo_id: int, current_user: dict = Depends(get_current_user)):
    """Get photo by ID"""
    return await photo_upload_service.get_photo(photo_id)

@router.delete("/{photo_id}")
async def delete_photo(photo_id: int, current_user: dict = Depends(get_current_user)):
    """Delete photo"""
    return await photo_upload_service.delete_photo(photo_id)

