"""
Photo Upload Service - Asillah (Module 1)
Business logic for photo upload operations
"""
from fastapi import UploadFile, HTTPException
from app.database.connection import get_db
from app.config import settings
import os
import uuid
from datetime import datetime

class PhotoUploadService:
    def __init__(self):
        self.db = get_db()
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    async def upload_photo(self, file: UploadFile, equipment_id: int = None, current_user: dict = None) -> dict:
        """Upload photo to storage and database"""
        try:
            # Generate unique filename
            file_ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
            
            # Save file locally
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Get file size
            file_size = len(content)
            
            # TODO: Upload to Supabase storage
            # storage_url = await self.upload_to_supabase_storage(file_path, unique_filename)
            
            # Save to database
            photo_data = {
                "equipment_id": equipment_id,
                "uploaded_by": current_user.get("id") if current_user else None,
                "file_path": file_path,
                "storage_url": None,  # storage_url,
                "file_name": file.filename,
                "file_size": file_size,
                "uploaded_at": str(datetime.utcnow())
            }
            
            res = self.db.table("Photo").insert(photo_data).execute()
            
            if res.data:
                return {"success": True, "photo": res.data[0]}
            else:
                raise HTTPException(status_code=400, detail="Failed to save photo")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading photo: {str(e)}")
    
    async def get_photo(self, photo_id: int) -> dict:
        """Get photo information"""
        try:
            res = self.db.table("Photo").select("*").eq("id", photo_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Photo not found")
            return res.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching photo: {str(e)}")
    
    async def delete_photo(self, photo_id: int) -> dict:
        """Delete photo from storage and database"""
        try:
            # Get photo info
            photo = await self.get_photo(photo_id)
            
            # Delete file
            if os.path.exists(photo["file_path"]):
                os.remove(photo["file_path"])
            
            # Delete from database
            self.db.table("Photo").delete().eq("id", photo_id).execute()
            
            return {"success": True, "message": "Photo deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting photo: {str(e)}")

