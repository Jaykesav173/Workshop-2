"""
Template Management Service
Handles CRUD operations for Finding and Recommendation templates
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import (
    FindingTemplateCreate, FindingTemplateUpdate, FindingTemplateResponse,
    RecommendationTemplateCreate, RecommendationTemplateUpdate, RecommendationTemplateResponse
)
from typing import List, Optional

class TemplateManagementService:
    def __init__(self):
        self.db = get_db()
    
    # ============================================
    # Finding Template Operations
    # ============================================
    
    async def get_finding_templates(self, active_only: bool = True) -> List[dict]:
        """Get all finding templates, optionally filter by active status"""
        try:
            query = self.db.table("FindingTemplate").select("*")
            if active_only:
                query = query.eq("is_active", "ACTIVE")
            query = query.order("created_at", desc=False)
            result = query.execute()
            return result.data or []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching finding templates: {str(e)}")
    
    async def get_finding_template(self, template_id: int) -> dict:
        """Get a single finding template by ID"""
        try:
            result = self.db.table("FindingTemplate").select("*").eq("id", template_id).execute()
            if not result.data:
                raise HTTPException(status_code=404, detail="Finding template not found")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching finding template: {str(e)}")
    
    async def create_finding_template(self, template: FindingTemplateCreate, user_id: int) -> dict:
        """Create a new finding template"""
        try:
            template_data = {
                "label": template.label,
                "text": template.text,
                "is_active": template.is_active or "ACTIVE",
                "created_by": user_id
            }
            result = self.db.table("FindingTemplate").insert(template_data).execute()
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to create finding template")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating finding template: {str(e)}")
    
    async def update_finding_template(self, template_id: int, template: FindingTemplateUpdate) -> dict:
        """Update an existing finding template"""
        try:
            # Check if template exists
            existing = await self.get_finding_template(template_id)
            
            # Build update data (only include fields that are provided)
            update_data = {}
            if template.label is not None:
                update_data["label"] = template.label
            if template.text is not None:
                update_data["text"] = template.text
            if template.is_active is not None:
                update_data["is_active"] = template.is_active
            
            if not update_data:
                return existing
            
            update_data["updated_at"] = "now()"
            
            result = self.db.table("FindingTemplate").update(update_data).eq("id", template_id).execute()
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to update finding template")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating finding template: {str(e)}")
    
    async def delete_finding_template(self, template_id: int) -> dict:
        """Delete a finding template (soft delete by setting is_active to INACTIVE)"""
        try:
            # Soft delete by setting is_active to INACTIVE
            update_data = {
                "is_active": "INACTIVE",
                "updated_at": "now()"
            }
            result = self.db.table("FindingTemplate").update(update_data).eq("id", template_id).execute()
            if not result.data:
                raise HTTPException(status_code=404, detail="Finding template not found")
            return {"success": True, "message": "Finding template deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting finding template: {str(e)}")
    
    # ============================================
    # Recommendation Template Operations
    # ============================================
    
    async def get_recommendation_templates(self, active_only: bool = True) -> List[dict]:
        """Get all recommendation templates, optionally filter by active status"""
        try:
            query = self.db.table("RecommendationTemplate").select("*")
            if active_only:
                query = query.eq("is_active", "ACTIVE")
            query = query.order("created_at", desc=False)
            result = query.execute()
            return result.data or []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching recommendation templates: {str(e)}")
    
    async def get_recommendation_template(self, template_id: int) -> dict:
        """Get a single recommendation template by ID"""
        try:
            result = self.db.table("RecommendationTemplate").select("*").eq("id", template_id).execute()
            if not result.data:
                raise HTTPException(status_code=404, detail="Recommendation template not found")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching recommendation template: {str(e)}")
    
    async def create_recommendation_template(self, template: RecommendationTemplateCreate, user_id: int) -> dict:
        """Create a new recommendation template"""
        try:
            template_data = {
                "label": template.label,
                "text": template.text,
                "is_active": template.is_active or "ACTIVE",
                "created_by": user_id
            }
            result = self.db.table("RecommendationTemplate").insert(template_data).execute()
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to create recommendation template")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating recommendation template: {str(e)}")
    
    async def update_recommendation_template(self, template_id: int, template: RecommendationTemplateUpdate) -> dict:
        """Update an existing recommendation template"""
        try:
            # Check if template exists
            existing = await self.get_recommendation_template(template_id)
            
            # Build update data (only include fields that are provided)
            update_data = {}
            if template.label is not None:
                update_data["label"] = template.label
            if template.text is not None:
                update_data["text"] = template.text
            if template.is_active is not None:
                update_data["is_active"] = template.is_active
            
            if not update_data:
                return existing
            
            update_data["updated_at"] = "now()"
            
            result = self.db.table("RecommendationTemplate").update(update_data).eq("id", template_id).execute()
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to update recommendation template")
            return result.data[0]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating recommendation template: {str(e)}")
    
    async def delete_recommendation_template(self, template_id: int) -> dict:
        """Delete a recommendation template (soft delete by setting is_active to INACTIVE)"""
        try:
            # Soft delete by setting is_active to INACTIVE
            update_data = {
                "is_active": "INACTIVE",
                "updated_at": "now()"
            }
            result = self.db.table("RecommendationTemplate").update(update_data).eq("id", template_id).execute()
            if not result.data:
                raise HTTPException(status_code=404, detail="Recommendation template not found")
            return {"success": True, "message": "Recommendation template deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting recommendation template: {str(e)}")

