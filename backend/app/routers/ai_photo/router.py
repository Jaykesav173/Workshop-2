"""
AI Photo Router
API endpoints for AI-powered defect detection
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.dependencies import get_current_user, get_optional_user
from typing import List, Optional
import logging
import importlib.util

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai_photo", tags=["AI Photo"])

# Initialize service lazily - try direct import first, fall back to importlib if needed
try:
    # Try direct import first (faster and cleaner if it works)
    from app.routers.ai_photo.service import AIPhotoService
    ai_photo_service = AIPhotoService()
    logger.info("AIPhotoService initialized successfully")
except (SyntaxError, ValueError, ImportError) as e:
    # If direct import fails due to null bytes or other issues, try importlib
    logger.warning(f"Direct import failed ({e}), trying importlib...")
    try:
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        service_path = os.path.join(current_dir, "service.py")
        service_spec = importlib.util.spec_from_file_location("ai_photo_service", service_path)
        service_module = importlib.util.module_from_spec(service_spec)
        service_spec.loader.exec_module(service_module)
        AIPhotoService = service_module.AIPhotoService
        ai_photo_service = AIPhotoService()
        logger.info("AIPhotoService initialized successfully via importlib")
    except Exception as importlib_error:
        logger.error(f"Failed to initialize AIPhotoService via importlib: {importlib_error}")
        import traceback
        logger.error(traceback.format_exc())
        ai_photo_service = None
except Exception as e:
    logger.error(f"Failed to initialize AIPhotoService: {e}")
    import traceback
    logger.error(traceback.format_exc())
    ai_photo_service = None

@router.post("/analyze")
async def analyze_photos(
    files: List[UploadFile] = File(...),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Analyze photos for defects using AI"""
    try:
        if ai_photo_service is None:
            logger.error("ai_photo_service is None - service not initialized")
            raise HTTPException(
                status_code=500, 
                detail="AI Photo service is not available. Check backend logs for initialization errors."
            )
        
        logger.info(f"Analyzing {len(files)} photos")
        result = await ai_photo_service.analyze_photos(files)
        logger.info(f"Analysis complete. Results: {len(result.get('results', []))}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze_photos endpoint: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing photos: {str(e)}. Check backend logs for details."
        )

@router.post("/confirm")
async def confirm_defect(
    file: UploadFile = File(...),
    ai_description: str = Form(...),
    ai_recommendation: str = Form(...),
    category: str = Form(...),
    severity: str = Form(...),
    box_2d: str = Form("[]"),
    current_user: dict = Depends(get_current_user)
):
    """Save confirmed defect to database"""
    if ai_photo_service is None:
        raise HTTPException(status_code=500, detail="AI Photo service is not available. Please check backend logs.")
    return await ai_photo_service.confirm_defect(
        file, ai_description, ai_recommendation, category, severity, box_2d, current_user
    )

@router.get("/my_defects")
async def get_my_defects(
    current_user: dict = Depends(get_current_user)
):
    """Get all defects saved by the current user"""
    if ai_photo_service is None:
        raise HTTPException(status_code=500, detail="AI Photo service is not available. Please check backend logs.")
    return await ai_photo_service.get_my_defects(current_user)
