"""
Inspection Workflow Service - Asillah (Module 2)
Business logic for inspection workflow operations
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import InspectionCreate, InspectionResponse, InspectionUpdate
from datetime import datetime

class InspectionWorkflowService:
    def __init__(self):
        self.db = get_db()
    
    async def create_inspection(self, inspection: InspectionCreate, current_user: dict) -> InspectionResponse:
        """Create new inspection - matches database schema: public."Inspection" """
        try:
            print(f"\n🔍 CREATE INSPECTION DEBUG:")
            print(f"   Current user: {current_user}")
            print(f"   Equipment ID: {inspection.equipment_id}")
            print(f"   Equipment tag no: {inspection.equipment_tag_no}")
            print(f"   Inspection type: {inspection.inspection_type}")
            print(f"   Priority: {inspection.priority}")
            print(f"   Status: {inspection.status}")
            
            # Handle date conversion - dates can come as strings or datetime objects
            def format_date(date_value):
                if date_value is None:
                    return None
                if isinstance(date_value, str):
                    return date_value  # Already a string, use as-is
                if isinstance(date_value, datetime):
                    return date_value.isoformat()
                return None
            
            # If equipment_id is provided, fetch equipment_tag_no from equipment table
            equipment_tag_no = inspection.equipment_tag_no
            if inspection.equipment_id and not equipment_tag_no:
                try:
                    equipment_res = self.db.table("equipment").select("equipment_tag_no").eq("id", inspection.equipment_id).execute()
                    if equipment_res.data and equipment_res.data[0].get("equipment_tag_no"):
                        equipment_tag_no = equipment_res.data[0]["equipment_tag_no"]
                        print(f"   ✅ Fetched equipment_tag_no: {equipment_tag_no}")
                    else:
                        raise HTTPException(status_code=400, detail=f"Equipment with ID {inspection.equipment_id} not found")
                except Exception as e:
                    print(f"   ⚠️ Error fetching equipment: {str(e)}")
                    raise HTTPException(status_code=400, detail=f"Failed to fetch equipment: {str(e)}")
            
            if not equipment_tag_no:
                raise HTTPException(status_code=400, detail="equipment_tag_no is required. Please provide equipment_id or equipment_tag_no.")
            
            # Get user_id from current_user (JWT payload)
            user_id = current_user.get("id")
            if not user_id:
                raise HTTPException(status_code=400, detail="User ID not found in token")
            
            # Handle inspection_date - use provided date or default to now
            inspection_date_value = format_date(inspection.inspection_date)
            if not inspection_date_value:
                inspection_date_value = datetime.utcnow().isoformat()
            
            # Build inspection data matching database schema
            inspection_data = {
                "inspection_date": inspection_date_value,
                "equipment_tag_no": equipment_tag_no,
                "defect_type": inspection.defect_type,
                "remarks": inspection.remarks,
                "user_id": user_id,
                "inspection_type": inspection.inspection_type,
                "status": inspection.status or "Draft",
                "priority": inspection.priority,
                "scheduled_date": format_date(inspection.scheduled_date),
                "due_date": format_date(inspection.due_date),
                "next_inspection_date": format_date(inspection.next_inspection_date),
                "remarks_general": inspection.remarks_general,
                "findings_summary": inspection.findings_summary,
                "plant_unit_area": inspection.plant_unit_area,
            }
            
            # Remove None values to avoid database issues
            inspection_data = {k: v for k, v in inspection_data.items() if v is not None}
            
            print(f"   📝 Inserting inspection data: {inspection_data}")
            res = self.db.table("Inspection").insert(inspection_data).execute()
            
            if res.data:
                print(f"   ✅ Inspection created successfully: {res.data[0]}")
                return InspectionResponse(**res.data[0])
            else:
                raise HTTPException(status_code=400, detail="Failed to create inspection")
        except HTTPException:
            raise
        except Exception as e:
            import traceback
            print(f"Error creating inspection: {str(e)}")
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error creating inspection: {str(e)}")
    
    async def get_inspections(self) -> list[InspectionResponse]:
        """Get all inspections"""
        try:
            res = self.db.table("Inspection").select("*").execute()
            if res.data:
                return [InspectionResponse(**inspection) for inspection in res.data]
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching inspections: {str(e)}")
    
    async def get_inspection(self, inspection_id: int) -> InspectionResponse:
        """Get inspection by ID"""
        try:
            res = self.db.table("Inspection").select("*").eq("inspection_id", inspection_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Inspection not found")
            return InspectionResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching inspection: {str(e)}")
    
    async def update_status(self, inspection_id: int, status: str) -> dict:
        """Update inspection status"""
        try:
            # Status can be: Draft, Completed, etc. (more flexible)
            update_data = {"status": status}
            
            res = self.db.table("Inspection").update(update_data).eq("inspection_id", inspection_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="Inspection not found")
            
            return {"success": True, "inspection": res.data[0]}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating inspection: {str(e)}")
    
    async def update_inspection(self, inspection_id: int, inspection_update: InspectionUpdate) -> InspectionResponse:
        """Update inspection details"""
        try:
            # Convert datetime objects to ISO format strings for database
            def format_date(date_value):
                if date_value is None:
                    return None
                if isinstance(date_value, str):
                    return date_value  # Already a string, use as-is
                if isinstance(date_value, datetime):
                    return date_value.isoformat()
                return None
            
            # Build update data from the request, excluding None values
            update_data = {}
            
            if inspection_update.inspection_date is not None:
                update_data["inspection_date"] = format_date(inspection_update.inspection_date)
            if inspection_update.equipment_tag_no is not None:
                update_data["equipment_tag_no"] = inspection_update.equipment_tag_no
            if inspection_update.defect_type is not None:
                update_data["defect_type"] = inspection_update.defect_type
            if inspection_update.remarks is not None:
                update_data["remarks"] = inspection_update.remarks
            if inspection_update.inspection_type is not None:
                update_data["inspection_type"] = inspection_update.inspection_type
            if inspection_update.status is not None:
                update_data["status"] = inspection_update.status
            if inspection_update.priority is not None:
                update_data["priority"] = inspection_update.priority
            if inspection_update.scheduled_date is not None:
                update_data["scheduled_date"] = format_date(inspection_update.scheduled_date)
            if inspection_update.due_date is not None:
                update_data["due_date"] = format_date(inspection_update.due_date)
            if inspection_update.next_inspection_date is not None:
                update_data["next_inspection_date"] = format_date(inspection_update.next_inspection_date)
            if inspection_update.remarks_general is not None:
                update_data["remarks_general"] = inspection_update.remarks_general
            if inspection_update.findings_summary is not None:
                update_data["findings_summary"] = inspection_update.findings_summary
            if inspection_update.plant_unit_area is not None:
                update_data["plant_unit_area"] = inspection_update.plant_unit_area
            
            # Only update if there's data to update
            if not update_data:
                # Return existing inspection if no updates
                return await self.get_inspection(inspection_id)
            
            # Update the inspection
            res = self.db.table("Inspection").update(update_data).eq("inspection_id", inspection_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="Inspection not found")
            
            return InspectionResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            import traceback
            print(f"Error updating inspection: {str(e)}")
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error updating inspection: {str(e)}")
    
    async def delete_inspection(self, inspection_id: int) -> dict:
        """Delete inspection"""
        try:
            res = self.db.table("Inspection").delete().eq("inspection_id", inspection_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="Inspection not found")
            
            return {"success": True, "message": "Inspection deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting inspection: {str(e)}")
