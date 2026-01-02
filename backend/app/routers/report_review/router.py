from fastapi import APIRouter
from .routes_report_review import router as report_review_routes
from .routes_dashboard import router as dashboard_router

router = APIRouter()
router.include_router(report_review_routes)
router.include_router(dashboard_router)
