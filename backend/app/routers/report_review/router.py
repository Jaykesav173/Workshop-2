from fastapi import APIRouter
from .routes_report_review import router as report_review_routes

router = APIRouter()
router.include_router(report_review_routes)
