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

    # Create equipment
    async def create_equipment(self, equipment: EquipmentCreate, current_user: dict):
        try:
            equipment_data = {
                "equipment_tag_no": equipment.equipment_tag_no,
                "type_id": equipment.type_id,
                "material": equipment.material,
                "location": equipment.location,
                "inspection_due_date": str(equipment.inspection_due_date) if equipment.inspection_due_date else None,
                "equipment_description": equipment.equipment_description,
                "dosh_registration_no": equipment.dosh_registration_no,
                "nominal_thickness": equipment.nominal_thickness,
                "corrosion_allowance": equipment.corrosion_allowance,
                "design_pressure": equipment.design_pressure,
                "design_temperature": equipment.design_temperature,
                "status": equipment.status,
                # "created_by": None,
                "created_at": str(datetime.utcnow())
            }

            res = self.db.table("equipment").insert(equipment_data).execute()

            if res.data:
                return EquipmentResponse(**res.data[0])
            raise HTTPException(status_code=400, detail="Failed to create equipment")

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating equipment: {str(e)}")

    # Upload equipment image
    async def upload_equipment_image(self, equipment_id: str, file: UploadFile, current_user: dict):
        try:
            # Verify if the equipment exists in the database
            await self.get_equipment(equipment_id)

            file_ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            file_size = len(content)

            photo_data = {
                "equipment_id": int(equipment_id), 
                "uploaded_by": current_user.get("id"),
                "file_path": file_path,
                "file_name": file.filename,
                "file_size": file_size,
                "storage_url": None,
                "uploaded_at": str(datetime.utcnow())
            }

            res = self.db.table("Photo").insert(photo_data).execute()

            if res.data:
                return {
                    "success": True,
                    "message": "Image uploaded successfully",
                    "photo": res.data[0],
                    "equipment_id": equipment_id
                }
            raise HTTPException(status_code=400, detail="Failed to save photo record")

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

    # to get all equipment
    async def get_all_equipment(self):
        try:
            res = self.db.table("equipment").select("*").order("id").execute()
            equipment_list = res.data if res.data else []
            
            # Fetch photos for all equipment
            if equipment_list:
                eq_ids = [e['id'] for e in equipment_list]
                photos_res = self.db.table("Photo").select("*").in_("equipment_id", eq_ids).execute()
                photos_map = {p['equipment_id']: p for p in photos_res.data} if photos_res.data else {}
                
                for eq in equipment_list:
                    if eq['id'] in photos_map:
                        filename = os.path.basename(photos_map[eq['id']]['file_path'])
                        eq['image_url'] = f"/static/uploads/{filename}"
            
            return [EquipmentResponse(**eq) for eq in equipment_list]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching equipment: {str(e)}")

    # Get the equipment by ID
    async def get_equipment(self, equipment_id: str):
        try:
            res = self.db.table("equipment").select("*").eq("id", equipment_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Equipment not found")
            
            equipment = res.data[0]
            
            # Fetch photo
            photo_res = self.db.table("Photo").select("*").eq("equipment_id", equipment_id).limit(1).execute()
            if photo_res.data:
                filename = os.path.basename(photo_res.data[0]['file_path'])
                equipment['image_url'] = f"/static/uploads/{filename}"
                
            return EquipmentResponse(**equipment)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching equipment: {str(e)}")

    # Update equipment information
    async def update_equipment(self, equipment_id: str, equipment: EquipmentCreate):
        try:
            update_data = {
                "equipment_tag_no": equipment.equipment_tag_no,
                "equipment_description": equipment.equipment_description,
                "type_id": equipment.type_id,
                "material": equipment.material,
                "location": equipment.location,
                "inspection_due_date": str(equipment.inspection_due_date) if equipment.inspection_due_date else None,
                "dosh_registration_no": equipment.dosh_registration_no,
                "nominal_thickness": equipment.nominal_thickness,
                "corrosion_allowance": equipment.corrosion_allowance,
                "design_pressure": equipment.design_pressure,
                "design_temperature": equipment.design_temperature,
                "status": equipment.status,
                "updated_at": str(datetime.utcnow())
            }

            res = self.db.table("equipment").update(update_data).eq("id", equipment_id).execute()

            if not res.data:
                raise HTTPException(status_code=404, detail="Equipment not found")

            return EquipmentResponse(**res.data[0])

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating equipment: {str(e)}")

    # Delete equipment
    async def delete_equipment(self, equipment_id: str):
        try:
            # Check if exists
            await self.get_equipment(equipment_id)

            # Delete photos first
            photos = self.db.table("Photo").select("*").eq("equipment_id", equipment_id).execute()
            if photos.data:
                for p in photos.data:
                    if os.path.exists(p["file_path"]):
                        try:
                            os.remove(p["file_path"])
                        except:
                            pass
                self.db.table("Photo").delete().eq("equipment_id", equipment_id).execute()

            # Delete equipment
            self.db.table("equipment").delete().eq("id", equipment_id).execute()

            return {"success": True, "message": "Equipment deleted successfully"}

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting equipment: {str(e)}")

    # Get Dropdown List Options
    async def get_equipment_options(self):
        try:
            res = self.db.table("type").select("id, description").execute()
            return {"types": res.data if res.data else []}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching types: {str(e)}")

    # # Get material options
    # async def get_material_options(self):
    #     try:
    #         res = self.db.table("material").select("id, description").execute()
    #         return {"materials": res.data if res.data else []}
    #     except Exception as e:
    #         raise HTTPException(status_code=500, detail=f"Error fetching materials: {str(e)}")
