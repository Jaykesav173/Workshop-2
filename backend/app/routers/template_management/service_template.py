"""
Template Management Service
Business logic for finding and recommendation templates
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import (
    FindingTemplateCreate, FindingTemplateUpdate, FindingTemplateResponse,
    RecommendationTemplateCreate, RecommendationTemplateUpdate, RecommendationTemplateResponse
)
from datetime import datetime

class TemplateService:
    def __init__(self):
        self.db = get_db()
    
    async def get_finding_templates(self, active_only: bool = True) -> list[FindingTemplateResponse]:
        """Get all finding templates"""
        try:
            query = self.db.table("FindingTemplate").select("*")
            if active_only:
                query = query.eq("is_active", "ACTIVE")
            
            res = query.execute()
            if res.data:
                return [FindingTemplateResponse(**template) for template in res.data]
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching finding templates: {str(e)}")
    
    async def create_finding_template(self, template: FindingTemplateCreate) -> FindingTemplateResponse:
        """Create a new finding template"""
        try:
            template_data = {
                "label": template.label,
                "text": template.text,
                "created_by": template.created_by,
                "is_active": template.is_active or "ACTIVE",
                "created_at": str(datetime.utcnow()),
                "updated_at": str(datetime.utcnow())
            }
            
            res = self.db.table("FindingTemplate").insert(template_data).execute()
            if not res.data:
                raise HTTPException(status_code=500, detail="Failed to create finding template")
            
            return FindingTemplateResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating finding template: {str(e)}")
    
    async def update_finding_template(self, template_id: int, template: FindingTemplateUpdate, current_user: dict) -> FindingTemplateResponse:
        """Update an existing finding template"""
        try:
            # Check if template exists
            res = self.db.table("FindingTemplate").select("*").eq("id", template_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Finding template not found")
            
            # Build update data
            update_data = {"updated_at": str(datetime.utcnow())}
            if template.label is not None:
                update_data["label"] = template.label
            if template.text is not None:
                update_data["text"] = template.text
            if template.is_active is not None:
                update_data["is_active"] = template.is_active
            
            res = self.db.table("FindingTemplate").update(update_data).eq("id", template_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Finding template not found after update")
            
            return FindingTemplateResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating finding template: {str(e)}")
    
    async def delete_finding_template(self, template_id: int, current_user: dict) -> dict:
        """Delete a finding template (soft delete)"""
        try:
            # Check if template exists
            res = self.db.table("FindingTemplate").select("*").eq("id", template_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Finding template not found")
            
            # Soft delete by setting is_active to 'INACTIVE'
            update_data = {
                "is_active": "INACTIVE",
                "updated_at": str(datetime.utcnow())
            }
            
            res = self.db.table("FindingTemplate").update(update_data).eq("id", template_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Finding template not found after update")
            
            return {"success": True, "message": "Finding template deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting finding template: {str(e)}")
    
    async def get_recommendation_templates(self, active_only: bool = True) -> list[RecommendationTemplateResponse]:
        """Get all recommendation templates"""
        try:
            query = self.db.table("RecommendationTemplate").select("*")
            if active_only:
                query = query.eq("is_active", "ACTIVE")
            
            res = query.execute()
            if res.data:
                return [RecommendationTemplateResponse(**template) for template in res.data]
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching recommendation templates: {str(e)}")
    
    async def create_recommendation_template(self, template: RecommendationTemplateCreate) -> RecommendationTemplateResponse:
        """Create a new recommendation template"""
        try:
            template_data = {
                "label": template.label,
                "text": template.text,
                "created_by": template.created_by,
                "is_active": template.is_active or "ACTIVE",
                "created_at": str(datetime.utcnow()),
                "updated_at": str(datetime.utcnow())
            }
            
            res = self.db.table("RecommendationTemplate").insert(template_data).execute()
            if not res.data:
                raise HTTPException(status_code=500, detail="Failed to create recommendation template")
            
            return RecommendationTemplateResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating recommendation template: {str(e)}")
    
    async def update_recommendation_template(self, template_id: int, template: RecommendationTemplateUpdate, current_user: dict) -> RecommendationTemplateResponse:
        """Update an existing recommendation template"""
        try:
            # Check if template exists
            res = self.db.table("RecommendationTemplate").select("*").eq("id", template_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Recommendation template not found")
            
            # Build update data
            update_data = {"updated_at": str(datetime.utcnow())}
            if template.label is not None:
                update_data["label"] = template.label
            if template.text is not None:
                update_data["text"] = template.text
            if template.is_active is not None:
                update_data["is_active"] = template.is_active
            
            res = self.db.table("RecommendationTemplate").update(update_data).eq("id", template_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Recommendation template not found after update")
            
            return RecommendationTemplateResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating recommendation template: {str(e)}")
    
    async def delete_recommendation_template(self, template_id: int, current_user: dict) -> dict:
        """Delete a recommendation template (soft delete)"""
        try:
            # Check if template exists
            res = self.db.table("RecommendationTemplate").select("*").eq("id", template_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Recommendation template not found")
            
            # Soft delete by setting is_active to 'INACTIVE'
            update_data = {
                "is_active": "INACTIVE",
                "updated_at": str(datetime.utcnow())
            }
            
            res = self.db.table("RecommendationTemplate").update(update_data).eq("id", template_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Recommendation template not found after update")
            
            return {"success": True, "message": "Recommendation template deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting recommendation template: {str(e)}")

