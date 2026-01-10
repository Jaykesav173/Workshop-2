"""
Template Management Routes
API endpoints for finding and recommendation templates
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.routers.template_management.service_template import TemplateService
from app.database.schemas import (
    FindingTemplateCreate, FindingTemplateUpdate, FindingTemplateResponse,
    RecommendationTemplateCreate, RecommendationTemplateUpdate, RecommendationTemplateResponse
)
from app.dependencies import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/templates", tags=["Template Management"])

template_service = TemplateService()

# Finding Template Routes
@router.get("/findings", response_model=List[FindingTemplateResponse])
async def get_finding_templates(
    active_only: bool = Query(True, alias="activeOnly"),
    current_user: dict = Depends(get_current_user)
):
    """Get all finding templates"""
    return await template_service.get_finding_templates(active_only)

@router.post("/findings", response_model=FindingTemplateResponse)
async def create_finding_template(
    template: FindingTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new finding template"""
    template.created_by = current_user.get("id")
    return await template_service.create_finding_template(template)

@router.put("/findings/{template_id}", response_model=FindingTemplateResponse)
async def update_finding_template(
    template_id: int,
    template: FindingTemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing finding template"""
    return await template_service.update_finding_template(template_id, template, current_user)

@router.delete("/findings/{template_id}")
async def delete_finding_template(
    template_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a finding template (soft delete by setting is_active to 'INACTIVE')"""
    return await template_service.delete_finding_template(template_id, current_user)

# Recommendation Template Routes
@router.get("/recommendations", response_model=List[RecommendationTemplateResponse])
async def get_recommendation_templates(
    active_only: bool = Query(True, alias="activeOnly"),
    current_user: dict = Depends(get_current_user)
):
    """Get all recommendation templates"""
    return await template_service.get_recommendation_templates(active_only)

@router.post("/recommendations", response_model=RecommendationTemplateResponse)
async def create_recommendation_template(
    template: RecommendationTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new recommendation template"""
    template.created_by = current_user.get("id")
    return await template_service.create_recommendation_template(template)

@router.put("/recommendations/{template_id}", response_model=RecommendationTemplateResponse)
async def update_recommendation_template(
    template_id: int,
    template: RecommendationTemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing recommendation template"""
    return await template_service.update_recommendation_template(template_id, template, current_user)

@router.delete("/recommendations/{template_id}")
async def delete_recommendation_template(
    template_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a recommendation template (soft delete by setting is_active to 'INACTIVE')"""
    return await template_service.delete_recommendation_template(template_id, current_user)

