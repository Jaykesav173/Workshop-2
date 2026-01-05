"""
Inspection Workflow Routes - Asillah (Module 2)
API endpoints for inspection workflow management
"""
from fastapi import APIRouter, Depends
from app.database.schemas import InspectionCreate, InspectionResponse, InspectionUpdate, ObservationCreate, ObservationResponse
from app.routers.inspection_workflow.service_inspection_workflow import InspectionWorkflowService
from app.routers.inspection_workflow.service_observations import ObservationService
from app.routers.inspection_workflow.service_inspection_photo import InspectionPhotoService
from app.dependencies import get_current_user
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/inspections", tags=["Inspection Workflow"])

inspection_service = InspectionWorkflowService()
observation_service = ObservationService()
inspection_photo_service = InspectionPhotoService()

@router.post("/", response_model=InspectionResponse)
async def create_inspection(
    inspection: InspectionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new inspection"""
    return await inspection_service.create_inspection(inspection, current_user)

@router.get("/", response_model=list[InspectionResponse])
async def get_inspections(current_user: dict = Depends(get_current_user)):
    """Get all inspections"""
    return await inspection_service.get_inspections()

@router.get("/{inspection_id}", response_model=InspectionResponse)
async def get_inspection(inspection_id: int, current_user: dict = Depends(get_current_user)):
    """Get inspection by ID"""
    return await inspection_service.get_inspection(inspection_id)

@router.patch("/{inspection_id}/status")
async def update_inspection_status(
    inspection_id: int,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    """Update inspection status"""
    return await inspection_service.update_status(inspection_id, status)

@router.put("/{inspection_id}", response_model=InspectionResponse)
async def update_inspection(
    inspection_id: int,
    inspection_update: InspectionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update inspection details"""
    return await inspection_service.update_inspection(inspection_id, inspection_update)

@router.delete("/{inspection_id}")
async def delete_inspection(
    inspection_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete inspection"""
    return await inspection_service.delete_inspection(inspection_id)

# ============================================
# Observation Routes
# ============================================

@router.post("/{inspection_id}/observations", response_model=ObservationResponse)
async def create_observation(
    inspection_id: int,
    observation: ObservationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new observation for an inspection"""
    observation.inspection_id = inspection_id  # Ensure inspection_id matches URL
    return await observation_service.create_observation(observation)

@router.get("/{inspection_id}/observations", response_model=List[ObservationResponse])
async def get_observations(
    inspection_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get all observations for an inspection"""
    return await observation_service.get_observations_by_inspection(inspection_id)

@router.get("/observations/{observation_id}", response_model=ObservationResponse)
async def get_observation(
    observation_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get observation by ID"""
    return await observation_service.get_observation(observation_id)

@router.put("/observations/{observation_id}", response_model=ObservationResponse)
async def update_observation(
    observation_id: int,
    observation: ObservationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update observation"""
    return await observation_service.update_observation(observation_id, observation)

@router.delete("/observations/{observation_id}")
async def delete_observation(
    observation_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete observation"""
    return await observation_service.delete_observation(observation_id)

# ============================================
# Inspection Photo Routes
# ============================================

class LinkPhotoRequest(BaseModel):
    photo_id: int
    group_number: int
    photo_number: Optional[str] = None
    finding_key: Optional[str] = None

@router.post("/{inspection_id}/photos/link")
async def link_photo_to_inspection(
    inspection_id: int,
    request: LinkPhotoRequest,
    current_user: dict = Depends(get_current_user)
):
    """Link a photo to an inspection with group number and optional finding key"""
    return await inspection_photo_service.link_photo_to_inspection(
        inspection_id=inspection_id,
        photo_id=request.photo_id,
        group_number=request.group_number,
        photo_number=request.photo_number,
        finding_key=request.finding_key
    )

@router.get("/{inspection_id}/photos", response_model=List[dict])
async def get_inspection_photos(
    inspection_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get all photos for an inspection with their group numbers and finding keys"""
    return await inspection_photo_service.get_inspection_photos(inspection_id)

class UpdateFindingKeyRequest(BaseModel):
    finding_key: Optional[str] = None

@router.patch("/{inspection_id}/photos/{photo_id}/finding-key")
async def update_photo_finding_key(
    inspection_id: int,
    photo_id: int,
    request: UpdateFindingKeyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update finding key for a photo in an inspection"""
    return await inspection_photo_service.update_photo_finding_key(
        inspection_id=inspection_id,
        photo_id=photo_id,
        finding_key=request.finding_key
    )

@router.delete("/{inspection_id}/photos/{photo_id}")
async def delete_inspection_photo_link(
    inspection_id: int,
    photo_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Remove photo link from inspection"""
    return await inspection_photo_service.delete_inspection_photo_link(
        inspection_id=inspection_id,
        photo_id=photo_id
    )