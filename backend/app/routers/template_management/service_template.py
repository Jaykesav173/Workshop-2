"""
Template Management Service
Business logic for FindingTemplate and RecommendationTemplate CRUD operations
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import (
    FindingTemplateCreate, FindingTemplateUpdate, FindingTemplateResponse,
    RecommendationTemplateCreate, RecommendationTemplateUpdate, RecommendationTemplateResponse
)

class TemplateService:
    def __init__(self):
        self.db = get_db()
    
    # Finding Template Methods
    async def get_finding_templates(self, active_only: bool = True) -> list:
        """Get all finding templates"""
        try:
            query = self.db.table("FindingTemplate").select("*")
            if active_only:
                query = query.eq("is_active", "ACTIVE")
            result = query.order("created_at", desc=True).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching finding templates: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch finding templates: {str(e)}")
    
    async def create_finding_template(self, template: FindingTemplateCreate, user_id: int) -> dict:
        """Create a new finding template"""
        try:
            data = {
                "label": template.label,
                "text": template.text,
                "is_active": template.is_active or "ACTIVE",
                "created_by": user_id
            }
            result = self.db.table("FindingTemplate").insert(data).execute()
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to create finding template")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error creating finding template: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create finding template: {str(e)}")
    
    async def update_finding_template(self, template_id: int, template: FindingTemplateUpdate, user_id: int) -> dict:
        """Update an existing finding template"""
        try:
            # Check if template exists and user has permission
            existing = self.db.table("FindingTemplate").select("*").eq("id", template_id).execute()
            if not existing.data:
                raise HTTPException(status_code=404, detail="Finding template not found")
            
            # Only allow update if user created it or is admin
            if existing.data[0].get("created_by") != user_id:
                # Check if user is admin (you may need to fetch user role)
                raise HTTPException(status_code=403, detail="Not authorized to update this template")
            
            update_data = {}
            if template.label is not None:
                update_data["label"] = template.label
            if template.text is not None:
                update_data["text"] = template.text
            if template.is_active is not None:
                update_data["is_active"] = template.is_active
            
            result = self.db.table("FindingTemplate").update(update_data).eq("id", template_id).execute()
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to update finding template")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error updating finding template: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to update finding template: {str(e)}")
    
    async def delete_finding_template(self, template_id: int, user_id: int) -> dict:
        """Soft delete a finding template (set is_active to INACTIVE)"""
        try:
            existing = self.db.table("FindingTemplate").select("*").eq("id", template_id).execute()
            if not existing.data:
                raise HTTPException(status_code=404, detail="Finding template not found")
            
            if existing.data[0].get("created_by") != user_id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this template")
            
            result = self.db.table("FindingTemplate").update({"is_active": "INACTIVE"}).eq("id", template_id).execute()
            return {"message": "Template deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error deleting finding template: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to delete finding template: {str(e)}")
    
    # Recommendation Template Methods
    async def get_recommendation_templates(self, active_only: bool = True) -> list:
        """Get all recommendation templates"""
        try:
            query = self.db.table("RecommendationTemplate").select("*")
            if active_only:
                query = query.eq("is_active", "ACTIVE")
            result = query.order("created_at", desc=True).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching recommendation templates: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch recommendation templates: {str(e)}")
    
    async def create_recommendation_template(self, template: RecommendationTemplateCreate, user_id: int) -> dict:
        """Create a new recommendation template"""
        try:
            data = {
                "label": template.label,
                "text": template.text,
                "is_active": template.is_active or "ACTIVE",
                "created_by": user_id
            }
            result = self.db.table("RecommendationTemplate").insert(data).execute()
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to create recommendation template")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error creating recommendation template: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create recommendation template: {str(e)}")
    
    async def update_recommendation_template(self, template_id: int, template: RecommendationTemplateUpdate, user_id: int) -> dict:
        """Update an existing recommendation template"""
        try:
            existing = self.db.table("RecommendationTemplate").select("*").eq("id", template_id).execute()
            if not existing.data:
                raise HTTPException(status_code=404, detail="Recommendation template not found")
            
            if existing.data[0].get("created_by") != user_id:
                raise HTTPException(status_code=403, detail="Not authorized to update this template")
            
            update_data = {}
            if template.label is not None:
                update_data["label"] = template.label
            if template.text is not None:
                update_data["text"] = template.text
            if template.is_active is not None:
                update_data["is_active"] = template.is_active
            
            result = self.db.table("RecommendationTemplate").update(update_data).eq("id", template_id).execute()
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to update recommendation template")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error updating recommendation template: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to update recommendation template: {str(e)}")
    
    async def delete_recommendation_template(self, template_id: int, user_id: int) -> dict:
        """Soft delete a recommendation template (set is_active to INACTIVE)"""
        try:
            existing = self.db.table("RecommendationTemplate").select("*").eq("id", template_id).execute()
            if not existing.data:
                raise HTTPException(status_code=404, detail="Recommendation template not found")
            
            if existing.data[0].get("created_by") != user_id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this template")
            
            result = self.db.table("RecommendationTemplate").update({"is_active": "INACTIVE"}).eq("id", template_id).execute()
            return {"message": "Template deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error deleting recommendation template: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to delete recommendation template: {str(e)}")

