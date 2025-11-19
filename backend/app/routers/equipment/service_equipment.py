"""
Equipment Service - Yi Jing (Module 1, equipment info)
Business logic for equipment management with image upload
"""
from fastapi import HTTPException, UploadFile
from app.database.connection import get_db
from app.database.schemas import EquipmentCreate, EquipmentResponse
from app.config import settings
from datetime import datetime
import os
import uuid

class EquipmentService:
    def __init__(self):
        self.db = get_db()
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    async def create_equipment(self, equipment: EquipmentCreate, current_user: dict) -> EquipmentResponse:
        """Create new equipment record (register equipment not in database)"""
        try:
            equipment_data = {
                "name": equipment.name,
                "type": equipment.type,
                "location": equipment.location,
                "serial_number": equipment.serial_number,
                "manufacturer": equipment.manufacturer,
                "model_number": equipment.model_number,
                "installation_date": str(equipment.installation_date) if equipment.installation_date else None,
                "status": "ACTIVE",
                "created_by": current_user.get("id"),
                "created_at": str(datetime.utcnow())
            }
            
            res = self.db.table("Equipment").insert(equipment_data).execute()
            
            if res.data:
                return EquipmentResponse(**res.data[0])
            else:
                raise HTTPException(status_code=400, detail="Failed to create equipment")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating equipment: {str(e)}")
    
    async def upload_equipment_image(self, equipment_id: int, file: UploadFile, current_user: dict) -> dict:
        """Upload image for equipment (automatically saved to database under equipment record)"""
        try:
            # Verify equipment exists
            equipment = await self.get_equipment(equipment_id)
            
            # Generate unique filename
            file_ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
            
            # Save file locally
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            file_size = len(content)
            
            # Save to database under equipment record
            photo_data = {
                "equipment_id": equipment_id,
                "uploaded_by": current_user.get("id"),
                "file_path": file_path,
                "storage_url": None,  # TODO: Upload to Supabase storage
                "file_name": file.filename,
                "file_size": file_size,
                "uploaded_at": str(datetime.utcnow())
            }
            
            res = self.db.table("Photo").insert(photo_data).execute()
            
            if res.data:
                return {
                    "success": True,
                    "message": "Image uploaded and saved to equipment record",
                    "photo": res.data[0],
                    "equipment_id": equipment_id
                }
            else:
                raise HTTPException(status_code=400, detail="Failed to save image")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")
    
    async def get_all_equipment(self) -> list[EquipmentResponse]:
        """Get all equipment"""
        try:
            res = self.db.table("Equipment").select("*").execute()
            if res.data:
                return [EquipmentResponse(**equipment) for equipment in res.data]
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching equipment: {str(e)}")
    
    async def get_equipment(self, equipment_id: int) -> EquipmentResponse:
        """Get equipment by ID"""
        try:
            res = self.db.table("Equipment").select("*").eq("id", equipment_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Equipment not found")
            return EquipmentResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching equipment: {str(e)}")
    
    async def update_equipment(self, equipment_id: int, equipment: EquipmentCreate) -> EquipmentResponse:
        """Update equipment information (edit record)"""
        try:
            update_data = {
                "name": equipment.name,
                "type": equipment.type,
                "location": equipment.location,
                "serial_number": equipment.serial_number,
                "manufacturer": equipment.manufacturer,
                "model_number": equipment.model_number,
                "installation_date": str(equipment.installation_date) if equipment.installation_date else None,
                "updated_at": str(datetime.utcnow())
            }
            
            res = self.db.table("Equipment").update(update_data).eq("id", equipment_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="Equipment not found")
            
            return EquipmentResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating equipment: {str(e)}")
    
    async def delete_equipment(self, equipment_id: int) -> dict:
        """Delete equipment record if no longer needed"""
        try:
            # Hard delete - remove from database
            # First check if equipment exists
            equipment = await self.get_equipment(equipment_id)
            
            # Delete associated photos
            photos = self.db.table("Photo").select("*").eq("equipment_id", equipment_id).execute()
            if photos.data:
                for photo in photos.data:
                    if os.path.exists(photo.get("file_path", "")):
                        os.remove(photo["file_path"])
                self.db.table("Photo").delete().eq("equipment_id", equipment_id).execute()
            
            # Delete equipment
            self.db.table("Equipment").delete().eq("id", equipment_id).execute()
            
            return {"success": True, "message": "Equipment and associated images deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting equipment: {str(e)}")

