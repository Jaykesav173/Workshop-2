"""
Inspection Workflow Service - Asillah (Module 2)
Business logic for inspection workflow operations
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import InspectionCreate, InspectionResponse
from datetime import datetime

class InspectionWorkflowService:
    def __init__(self):
        self.db = get_db()
    
    async def create_inspection(self, inspection: InspectionCreate, current_user: dict) -> InspectionResponse:
        """Create new inspection"""
        try:
            inspection_data = {
                "equipment_id": inspection.equipment_id,
                "inspector_id": current_user.get("id") or inspection.inspector_id,
                "status": "PENDING",
                "created_at": str(datetime.utcnow())
            }
            
            res = self.db.table("Inspection").insert(inspection_data).execute()
            
            if res.data:
                return InspectionResponse(**res.data[0])
            else:
                raise HTTPException(status_code=400, detail="Failed to create inspection")
        except HTTPException:
            raise
        except Exception as e:
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
            res = self.db.table("Inspection").select("*").eq("id", inspection_id).execute()
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
            valid_statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "APPROVED"]
            if status not in valid_statuses:
                raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
            
            update_data = {"status": status}
            if status == "COMPLETED":
                update_data["completed_at"] = str(datetime.utcnow())
            
            res = self.db.table("Inspection").update(update_data).eq("id", inspection_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="Inspection not found")
            
            return {"success": True, "inspection": res.data[0]}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating inspection: {str(e)}")

