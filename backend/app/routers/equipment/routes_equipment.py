"""
Equipment Routes - Yi Jing (Module 1, equipment info)
API endpoints for equipment management with image upload
"""
from fastapi import APIRouter, Depends, UploadFile, File
from app.database.schemas import EquipmentCreate, EquipmentResponse
from app.routers.equipment.service_equipment import EquipmentService
from app.dependencies import get_current_user

router = APIRouter(prefix="/equipment", tags=["Equipment"])

equipment_service = EquipmentService()

@router.post("/", response_model=EquipmentResponse)
async def create_equipment(
    equipment: EquipmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new equipment record (register equipment not in database)"""
    return await equipment_service.create_equipment(equipment, current_user)

@router.post("/{equipment_id}/upload-image")
async def upload_equipment_image(
    equipment_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload image for equipment (automatically saved to database under equipment record)"""
    return await equipment_service.upload_equipment_image(equipment_id, file, current_user)

@router.get("/", response_model=list[EquipmentResponse])
async def get_all_equipment(current_user: dict = Depends(get_current_user)):
    """Get all equipment"""
    return await equipment_service.get_all_equipment()

@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(equipment_id: int, current_user: dict = Depends(get_current_user)):
    """Get equipment by ID"""
    return await equipment_service.get_equipment(equipment_id)

@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: int,
    equipment: EquipmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update equipment information (edit record)"""
    return await equipment_service.update_equipment(equipment_id, equipment)

@router.delete("/{equipment_id}")
async def delete_equipment(equipment_id: int, current_user: dict = Depends(get_current_user)):
    """Delete equipment record if no longer needed"""
    return await equipment_service.delete_equipment(equipment_id)

