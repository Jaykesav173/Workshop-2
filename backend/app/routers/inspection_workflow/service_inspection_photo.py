"""
Inspection Photo Service
Handles linking photos to inspections with group numbers and finding keys
"""
from fastapi import HTTPException
from app.database.connection import get_db
from typing import Optional, List
from datetime import datetime

class InspectionPhotoService:
    def __init__(self):
        self.db = get_db()
    
    async def link_photo_to_inspection(
        self,
        inspection_id: int,
        photo_id: int,
        group_number: int,
        photo_number: Optional[str] = None,
        finding_key: Optional[str] = None
    ) -> dict:
        """Link a photo to an inspection with group number and optional finding key"""
        try:
            print(f"🔗 Linking photo {photo_id} to inspection {inspection_id}, group {group_number}, number {photo_number}")
            
            # Check if photo is already linked to this inspection
            existing_link = self.db.table("InspectionPhoto").select("*").eq(
                "inspection_id", inspection_id
            ).eq("photo_id", photo_id).execute()
            
            if existing_link.data:
                # Photo already linked - update it
                print(f"📝 Photo {photo_id} already linked, updating...")
                link_data = {
                    "group_number": group_number,
                    "photo_number": photo_number,  # Update photo_number if provided
                    "finding_key": finding_key,
                    "updated_at": str(datetime.utcnow())
                }
                # Only update fields that are provided
                if photo_number is None:
                    link_data.pop("photo_number")
                if finding_key is None:
                    link_data.pop("finding_key")
                    
                res = self.db.table("InspectionPhoto").update(link_data).eq(
                    "inspection_id", inspection_id
                ).eq("photo_id", photo_id).execute()
            else:
                # Photo not linked yet - create new link
                # Generate photo_number if not provided (e.g., "1.1", "1.2")
                if not photo_number:
                    # Get existing photos in this group to determine next sub-number
                    existing = self.db.table("InspectionPhoto").select("*").eq(
                        "inspection_id", inspection_id
                    ).eq("group_number", group_number).execute()
                    
                    existing_count = len(existing.data) if existing.data else 0
                    photo_number = f"{group_number}.{existing_count + 1}"
                    print(f"📝 Generated photo_number: {photo_number}")
                
                # Check if photo_number already exists for this inspection (from a different photo)
                existing_number = self.db.table("InspectionPhoto").select("*").eq(
                    "inspection_id", inspection_id
                ).eq("photo_number", photo_number).execute()
                
                if existing_number.data:
                    # Photo number already taken - find next available number in this group
                    print(f"⚠️ Photo number {photo_number} already exists, finding next available...")
                    existing_in_group = self.db.table("InspectionPhoto").select("*").eq(
                        "inspection_id", inspection_id
                    ).eq("group_number", group_number).execute()
                    
                    # Get all existing photo numbers in this group
                    existing_numbers = set()
                    if existing_in_group.data:
                        for link in existing_in_group.data:
                            if link.get("photo_number"):
                                existing_numbers.add(link["photo_number"])
                    
                    # Find next available number
                    sub_num = 1
                    while True:
                        candidate = f"{group_number}.{sub_num}"
                        if candidate not in existing_numbers:
                            photo_number = candidate
                            print(f"📝 Using available photo_number: {photo_number}")
                            break
                        sub_num += 1
                        if sub_num > 1000:  # Safety limit
                            raise HTTPException(status_code=400, detail="Too many photos in this group")
                
                # Create new link
                link_data = {
                    "inspection_id": inspection_id,
                    "photo_id": photo_id,
                    "group_number": group_number,
                    "photo_number": photo_number,
                    "finding_key": finding_key,
                    "created_at": str(datetime.utcnow()),
                    "updated_at": str(datetime.utcnow())
                }
                res = self.db.table("InspectionPhoto").insert(link_data).execute()
            
            if res.data:
                result = res.data[0] if isinstance(res.data, list) else res.data
                print(f"✅ Successfully linked photo {photo_id} to inspection {inspection_id}")
                print(f"   Group: {group_number}, Number: {photo_number}, Finding: {finding_key}")
                return {"success": True, "data": result}
            else:
                print(f"❌ Failed to link photo - no data returned from insert/update")
                raise HTTPException(status_code=400, detail="Failed to link photo to inspection")
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Error linking photo: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error linking photo: {str(e)}")
    
    async def get_inspection_photos(self, inspection_id: int) -> List[dict]:
        """Get all photos for an inspection with their group numbers and finding keys"""
        try:
            print(f"📸 Fetching inspection photos for inspection {inspection_id}...")
            # Get all photo links for this inspection
            links_res = self.db.table("InspectionPhoto").select("*").eq(
                "inspection_id", inspection_id
            ).order("group_number", desc=False).order("photo_number", desc=False).execute()
            
            print(f"📸 Found {len(links_res.data) if links_res.data else 0} photo links")
            
            if not links_res.data:
                return []
            
            # Get photo details for each linked photo
            # Fetch photos individually (Supabase PostgREST doesn't support .in_() directly)
            photos_map = {}
            for link in links_res.data:
                photo_id = link["photo_id"]
                try:
                    photo_res = self.db.table("Photo").select("*").eq("id", photo_id).execute()
                    if photo_res.data:
                        photos_map[photo_id] = photo_res.data[0]
                except Exception as e:
                    print(f"Warning: Could not fetch photo {photo_id}: {e}")
                    continue
            
            # Combine photo data with inspection photo metadata
            result = []
            for link in links_res.data:
                photo = photos_map.get(link["photo_id"])
                if photo:
                    # CRITICAL: Ensure group_number from link is used (not from photo table)
                    combined_photo = {
                        **photo,
                        "group_number": link["group_number"],  # Override with link's group_number
                        "photo_number": link["photo_number"],
                        "finding_key": link.get("finding_key"),
                        "inspection_photo_id": link["inspection_photo_id"]
                    }
                    print(f"📸 Combined photo {photo['id']}: group_number={combined_photo['group_number']}, photo_number={combined_photo['photo_number']}")
                    result.append(combined_photo)
                else:
                    print(f"⚠️ Photo {link['photo_id']} not found in Photo table")
            
            print(f"📸 Returning {len(result)} photos with group numbers:")
            for r in result:
                print(f"   Photo {r['id']}: group={r.get('group_number')}, number={r.get('photo_number')}")
            
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching inspection photos: {str(e)}")
    
    async def update_photo_finding_key(
        self,
        inspection_id: int,
        photo_id: int,
        finding_key: Optional[str]
    ) -> dict:
        """Update finding key for a photo in an inspection"""
        try:
            update_data = {
                "finding_key": finding_key,
                "updated_at": str(datetime.utcnow())
            }
            res = self.db.table("InspectionPhoto").update(update_data).eq(
                "inspection_id", inspection_id
            ).eq("photo_id", photo_id).execute()
            
            if res.data:
                return {"success": True, "data": res.data[0] if isinstance(res.data, list) else res.data}
            else:
                raise HTTPException(status_code=404, detail="Photo link not found")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating finding key: {str(e)}")
    
    async def delete_inspection_photo_link(
        self,
        inspection_id: int,
        photo_id: int
    ) -> dict:
        """Remove photo link from inspection"""
        try:
            self.db.table("InspectionPhoto").delete().eq(
                "inspection_id", inspection_id
            ).eq("photo_id", photo_id).execute()
            
            return {"success": True, "message": "Photo link removed"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error removing photo link: {str(e)}")

