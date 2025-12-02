from fastapi import APIRouter
from .routes_equipment import router as equipment_routes

router = APIRouter()
router.include_router(equipment_routes)
