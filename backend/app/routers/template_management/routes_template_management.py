"""
Template Management Routes
API endpoints for managing Finding and Recommendation templates
"""
from fastapi import APIRouter, Depends, HTTPException
from app.database.schemas import (
    FindingTemplateCreate, FindingTemplateUpdate, FindingTemplateResponse,
    RecommendationTemplateCreate, RecommendationTemplateUpdate, RecommendationTemplateResponse
)
from app.routers.template_management.service_template_management import TemplateManagementService
from app.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/templates", tags=["Template Management"])

template_service = TemplateManagementService()

# ============================================
# Finding Template Routes
# ============================================

@router.get("/findings", response_model=List[FindingTemplateResponse])
async def get_finding_templates(
    active_only: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Get all finding templates"""
    return await template_service.get_finding_templates(active_only=active_only)

@router.get("/findings/{template_id}", response_model=FindingTemplateResponse)
async def get_finding_template(
    template_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a single finding template by ID"""
    return await template_service.get_finding_template(template_id)

@router.post("/findings", response_model=FindingTemplateResponse)
async def create_finding_template(
    template: FindingTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new finding template"""
    return await template_service.create_finding_template(template, current_user.get("id"))

@router.put("/findings/{template_id}", response_model=FindingTemplateResponse)
async def update_finding_template(
    template_id: int,
    template: FindingTemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing finding template"""
    return await template_service.update_finding_template(template_id, template)

@router.delete("/findings/{template_id}")
async def delete_finding_template(
    template_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a finding template (soft delete)"""
    return await template_service.delete_finding_template(template_id)

# ============================================
# Recommendation Template Routes
# ============================================

@router.get("/recommendations", response_model=List[RecommendationTemplateResponse])
async def get_recommendation_templates(
    active_only: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Get all recommendation templates"""
    return await template_service.get_recommendation_templates(active_only=active_only)

@router.get("/recommendations/{template_id}", response_model=RecommendationTemplateResponse)
async def get_recommendation_template(
    template_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a single recommendation template by ID"""
    return await template_service.get_recommendation_template(template_id)

@router.post("/recommendations", response_model=RecommendationTemplateResponse)
async def create_recommendation_template(
    template: RecommendationTemplateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new recommendation template"""
    return await template_service.create_recommendation_template(template, current_user.get("id"))

@router.put("/recommendations/{template_id}", response_model=RecommendationTemplateResponse)
async def update_recommendation_template(
    template_id: int,
    template: RecommendationTemplateUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing recommendation template"""
    return await template_service.update_recommendation_template(template_id, template)

@router.delete("/recommendations/{template_id}")
async def delete_recommendation_template(
    template_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a recommendation template (soft delete)"""
    return await template_service.delete_recommendation_template(template_id)

