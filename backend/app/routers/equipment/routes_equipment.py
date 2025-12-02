"""
Equipment Routes - Yi Jing (Module 1, equipment info)
API endpoints for equipment management with image upload
"""

from fastapi import APIRouter, Depends, UploadFile, File
from app.database.schemas import EquipmentCreate, EquipmentResponse, EquipmentOptionsResponse
from app.routers.equipment.service_equipment import EquipmentService
from app.dependencies import get_current_user
from fastapi import APIRouter, Depends
from app.database.connection import get_db

router = APIRouter(prefix="/equipment", tags=["Equipment"])

equipment_service = EquipmentService()

# -------------------------------------------------------------------------
# 1. Get Dropdown Options
# -------------------------------------------------------------------------

@router.get("/options")
async def get_equipment_options():
    return await equipment_service.get_equipment_options()

# -------------------------------------------------------------------------
# Create
# -------------------------------------------------------------------------
@router.post("/", response_model=EquipmentResponse)
async def create_equipment(
    equipment: EquipmentCreate
):
    # Dummy user for no-auth mode
    current_user = {"id": 1, "username": "dummy_user"}
    return await equipment_service.create_equipment(equipment, current_user)

# -------------------------------------------------------------------------
# Upload Image
# -------------------------------------------------------------------------
@router.post("/{equipment_id}/upload-image")
async def upload_equipment_image(
    equipment_id: str,
    file: UploadFile = File(...)
):
    current_user = {"id": 1, "username": "dummy_user"}
    return await equipment_service.upload_equipment_image(equipment_id, file, current_user)

# -------------------------------------------------------------------------
# Get All
# -------------------------------------------------------------------------
@router.get("/", response_model=list[EquipmentResponse])
async def get_all_equipment():
    return await equipment_service.get_all_equipment()

# -------------------------------------------------------------------------
# Get by ID (str)
# -------------------------------------------------------------------------
@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: str
):
    return await equipment_service.get_equipment(equipment_id)

# -------------------------------------------------------------------------
# Update
# -------------------------------------------------------------------------
@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: str,
    equipment: EquipmentCreate
):
    return await equipment_service.update_equipment(equipment_id, equipment)

# -------------------------------------------------------------------------
# Delete
# -------------------------------------------------------------------------
@router.delete("/{equipment_id}")
async def delete_equipment(
    equipment_id: str
):
    return await equipment_service.delete_equipment(equipment_id)
