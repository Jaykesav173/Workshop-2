"""
Inspection Workflow Routes - Asillah (Module 2)
API endpoints for inspection workflow management
"""
from fastapi import APIRouter, Depends
from app.database.schemas import InspectionCreate, InspectionResponse
from app.routers.inspection_workflow.service_inspection_workflow import InspectionWorkflowService
from app.dependencies import get_current_user

router = APIRouter(prefix="/inspections", tags=["Inspection Workflow"])

inspection_service = InspectionWorkflowService()

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

