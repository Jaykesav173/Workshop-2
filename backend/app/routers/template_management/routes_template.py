"""
Template Management Routes
API endpoints for FindingTemplate and RecommendationTemplate CRUD operations
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.database.schemas import (
    FindingTemplateCreate, FindingTemplateUpdate, FindingTemplateResponse,
    RecommendationTemplateCreate, RecommendationTemplateUpdate, RecommendationTemplateResponse
)
from app.routers.template_management.service_template import TemplateService
from app.dependencies import get_current_user

router = APIRouter(prefix="/templates", tags=["Templates"])

template_service = TemplateService()

# Finding Template Routes
@router.get("/findings", response_model=List[FindingTemplateResponse])
async def get_finding_templates(active_only: bool = True, current_user: dict = Depends(get_current_user)):
    """Get all finding templates"""
    return await template_service.get_finding_templates(active_only=active_only)

@router.post("/findings", response_model=FindingTemplateResponse)
async def create_finding_template(
    template: FindingTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new finding template"""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return await template_service.create_finding_template(template, user_id)

@router.put("/findings/{template_id}", response_model=FindingTemplateResponse)
async def update_finding_template(
    template_id: int,
    template: FindingTemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing finding template"""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return await template_service.update_finding_template(template_id, template, user_id)

@router.delete("/findings/{template_id}")
async def delete_finding_template(
    template_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete (soft delete) a finding template"""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return await template_service.delete_finding_template(template_id, user_id)

# Recommendation Template Routes
@router.get("/recommendations", response_model=List[RecommendationTemplateResponse])
async def get_recommendation_templates(active_only: bool = True, current_user: dict = Depends(get_current_user)):
    """Get all recommendation templates"""
    return await template_service.get_recommendation_templates(active_only=active_only)

@router.post("/recommendations", response_model=RecommendationTemplateResponse)
async def create_recommendation_template(
    template: RecommendationTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new recommendation template"""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return await template_service.create_recommendation_template(template, user_id)

@router.put("/recommendations/{template_id}", response_model=RecommendationTemplateResponse)
async def update_recommendation_template(
    template_id: int,
    template: RecommendationTemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing recommendation template"""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return await template_service.update_recommendation_template(template_id, template, user_id)

@router.delete("/recommendations/{template_id}")
async def delete_recommendation_template(
    template_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete (soft delete) a recommendation template"""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return await template_service.delete_recommendation_template(template_id, user_id)

