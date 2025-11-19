"""
Image Processing Service - Abdalla (Module 1, AI defect detection)
Business logic for AI-powered defect detection using TensorFlow Lite
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.config import settings
from app.ai_models.detector import DefectDetector
import os

class ImageProcessingService:
    def __init__(self):
        self.db = get_db()
        self.detector = DefectDetector(settings.MODEL_PATH) if os.path.exists(settings.MODEL_PATH) else None
    
    async def detect_defects(self, photo_id: int) -> dict:
        """Run AI defect detection on photo"""
        try:
            # Get photo from database
            res = self.db.table("Photo").select("*").eq("id", photo_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Photo not found")
            
            photo = res.data[0]
            file_path = photo["file_path"]
            
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail="Photo file not found")
            
            # Run detection
            if not self.detector:
                raise HTTPException(status_code=500, detail="AI model not available")
            
            defects = self.detector.detect(file_path)
            
            # Save defects to database
            defect_records = []
            for defect in defects:
                defect_data = {
                    "photo_id": photo_id,
                    "defect_type": defect.get("type", "UNKNOWN"),
                    "confidence_score": defect.get("confidence", 0.0),
                    "location_x": defect.get("x", 0),
                    "location_y": defect.get("y", 0),
                    "width": defect.get("width", 0),
                    "height": defect.get("height", 0)
                }
                res = self.db.table("Defect").insert(defect_data).execute()
                if res.data:
                    defect_records.append(res.data[0])
            
            return {
                "success": True,
                "photo_id": photo_id,
                "defects_detected": len(defect_records),
                "defects": defect_records
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error detecting defects: {str(e)}")
    
    async def get_detected_defects(self, photo_id: int) -> dict:
        """Get detected defects for a photo"""
        try:
            res = self.db.table("Defect").select("*").eq("photo_id", photo_id).execute()
            return {
                "success": True,
                "photo_id": photo_id,
                "defects": res.data if res.data else []
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching defects: {str(e)}")
    
    async def process_batch(self, photo_ids: list[int]) -> dict:
        """Process multiple photos for defect detection"""
        results = []
        for photo_id in photo_ids:
            try:
                result = await self.detect_defects(photo_id)
                results.append(result)
            except Exception as e:
                results.append({
                    "photo_id": photo_id,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "processed": len(results),
            "results": results
        }

