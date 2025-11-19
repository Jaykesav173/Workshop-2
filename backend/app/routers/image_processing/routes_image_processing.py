"""
Image Processing Routes - Abdalla (Module 1, AI defect detection)
API endpoints for AI-powered defect detection
"""
from fastapi import APIRouter, Depends
from app.routers.image_processing.service_image_processing import ImageProcessingService
from app.dependencies import get_current_user

router = APIRouter(prefix="/image-processing", tags=["Image Processing"])

image_processing_service = ImageProcessingService()

@router.post("/detect-defects/{photo_id}")
async def detect_defects(photo_id: int, current_user: dict = Depends(get_current_user)):
    """Run AI defect detection on photo"""
    return await image_processing_service.detect_defects(photo_id)

@router.get("/defects/{photo_id}")
async def get_detected_defects(photo_id: int, current_user: dict = Depends(get_current_user)):
    """Get detected defects for a photo"""
    return await image_processing_service.get_detected_defects(photo_id)

@router.post("/process-batch")
async def process_batch(photo_ids: list[int], current_user: dict = Depends(get_current_user)):
    """Process multiple photos for defect detection"""
    return await image_processing_service.process_batch(photo_ids)

