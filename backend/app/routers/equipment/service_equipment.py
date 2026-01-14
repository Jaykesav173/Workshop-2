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
from app.utils.storage import upload_file_to_storage, is_valid_image_url

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
                "material_id": equipment.material_id,
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
            
            raise HTTPException(status_code=400, detail="Failed to create equipment - no data returned")

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating equipment: {str(e)}")
    
    # Upload equipment image
    async def upload_equipment_image(self, equipment_id: str, file: UploadFile, current_user: dict, part_view: str = "General"):
        try:
            # Verify if the equipment exists in the database
            await self.get_equipment(equipment_id)
            
            # Read file content
            content = await file.read()
            file_size = len(content)
            
            # Upload to Supabase Storage
            # Uses the "photos" bucket and "equipment" folder
            storage_url = upload_file_to_storage(
                file_content=content,
                filename=file.filename,
                bucket_name="photos",
                folder="equipment"
            )
            
            if not storage_url:
                raise HTTPException(status_code=500, detail="Failed to upload image to cloud storage")
            
            photo_data = {
                "equipment_id": int(equipment_id), 
                "uploaded_by": current_user.get("id"),
                "file_path": storage_url, # Store URL in file_path too for compatibility
                "file_name": file.filename,
                "file_size": file_size,
                "storage_url": storage_url,
                "part_view": part_view,
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
                        # Find main photo or just use the first found
                        # We need to filter photos for THIS equipment
                        eq_photos = [p for p in photos_res.data if p['equipment_id'] == eq['id']]
                        if eq_photos:
                            # Set main image (first one or general)
                            photo = eq_photos[0]
                            if photo.get('storage_url'):
                                eq['image_url'] = photo['storage_url']
                            else:
                                # Check if file exists to avoid 404s
                                # Check if file exists to avoid 404s
                                # Strictly check in the served directory
                                filename = os.path.basename(photo['file_path'])
                                served_path = os.path.join(settings.UPLOAD_DIR, filename)
                                if os.path.exists(served_path):
                                    eq['image_url'] = f"/static/uploads/{filename}"
                                else:
                                    eq['image_url'] = None
                            
                            # Filter the photos list to only include existing files
                            valid_photos = []
                            for p in eq_photos:
                                if p.get('storage_url'):
                                    p['image_url'] = p['storage_url']
                                    valid_photos.append(p)
                                elif p.get('file_path'):
                                    filename = os.path.basename(p['file_path'])
                                    served_path = os.path.join(settings.UPLOAD_DIR, filename)
                                    if os.path.exists(served_path):
                                        p['image_url'] = f"/static/uploads/{filename}"
                                        valid_photos.append(p)
                                     
                            eq['photos'] = valid_photos
                            
                            # Update main image based on valid photos
                            if eq['image_url'] is None and valid_photos:
                                 photo = valid_photos[0]
                                 if photo.get('storage_url'):
                                     eq['image_url'] = photo['storage_url']
                                 else:
                                     filename = os.path.basename(photo['file_path'])
                                     # Strictly check in the served directory
                                     served_path = os.path.join(settings.UPLOAD_DIR, filename)
                                     if os.path.exists(served_path):
                                         eq['image_url'] = f"/static/uploads/{filename}"
                                     else:
                                         eq['image_url'] = None
                            elif not valid_photos:
                                # Ensure we don't return stale image_url from DB if no valid photos exist
                                eq['image_url'] = None
                        else:
                            eq['photos'] = []
                            eq['image_url'] = None
                    else:
                        eq['photos'] = []
                        eq['image_url'] = None
            
            return [EquipmentResponse(**eq) for eq in equipment_list]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching equipment: {str(e)}")

    # Get lightweight equipment list (for dropdowns)
    async def get_equipment_list(self):
        try:
            # Select all fields to satisfy EquipmentResponse schema, but skip photos
            res = self.db.table("equipment").select("*").order("equipment_tag_no").execute()
            equipment_list = res.data if res.data else []
            return [EquipmentResponse(**eq) for eq in equipment_list]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching equipment list: {str(e)}")
    
    # Get the equipment by ID
    async def get_equipment(self, equipment_id: str):
        try:
            res = self.db.table("equipment").select("*").eq("id", equipment_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Equipment not found")
            
            equipment = res.data[0]
            
            # Fetch photo
            photo_res = self.db.table("Photo").select("*").eq("equipment_id", equipment_id).execute()
            
            # Filter photos and populate image_url
            valid_photos = []
            if photo_res.data:
                for p in photo_res.data:
                    # Logic to determine image_url
                    if p.get('storage_url'):
                        p['image_url'] = p['storage_url']
                        valid_photos.append(p)
                    elif p.get('file_path'):
                        filename = os.path.basename(p['file_path'])
                        served_path = os.path.join(settings.UPLOAD_DIR, filename)
                        if os.path.exists(served_path):
                            p['image_url'] = f"/static/uploads/{filename}"
                            valid_photos.append(p)
            
            equipment['photos'] = valid_photos
            
            if valid_photos:
                # Use the first one or logic to pick 'General' as main
                photo = valid_photos[0]
                if photo.get('storage_url'):
                    equipment['image_url'] = photo['storage_url']
                else:
                    # Check if file exists to avoid 404s
                    filename = os.path.basename(photo['file_path'])
                    served_path = os.path.join(settings.UPLOAD_DIR, filename)
                    if os.path.exists(served_path):
                        equipment['image_url'] = f"/static/uploads/{filename}"
                    else:
                        equipment['image_url'] = None
            else:
                 equipment['image_url'] = None
                
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
                "material_id": equipment.material_id,
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
                    # Only try to delete local files
                    file_path = p.get("file_path")
                    if file_path and not is_valid_image_url(file_path):
                        if os.path.exists(file_path):
                            try:
                                os.remove(file_path)
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

    # Get material options
    async def get_material_options(self):
        try:
            res = self.db.table("material").select("id, description").execute()
            return {"materials": res.data if res.data else []}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching materials: {str(e)}")

    # Get Unique Part Views
    async def get_unique_part_views(self):
        try:
            # Fetch distinct part views from Photo table (column part_view)
            res = self.db.table("Photo").select("part_view").execute()
            existing_views = set()
            if res.data:
                for row in res.data:
                    if row.get("part_view"):
                         existing_views.add(row["part_view"])
            
            # Default types
            defaults = ["East Side", "South Side", "West Side", "North Side", "Nameplate", "Top View"]
            
            # Merge
            all_views = sorted(list(existing_views.union(defaults)))
            
            # Filter out General if it exists in DB (case-insensitive)
            # We want to exclude "General", "General View", and their case variants
            exclude_views = {"general", "general view", "generalview"}
            all_views = [v for v in all_views if v.lower() not in exclude_views]
            
            return {"part_views": all_views}
        except Exception as e:
            # Fallback to defaults
            defaults = ["East Side", "South Side", "West Side", "North Side", "Nameplate", "Top View"]
            return {"part_views": sorted(defaults)}
