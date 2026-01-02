import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app.routers.auth.router import router as auth_router
from app.routers.report_generation.router import router as report_generation_router
from app.routers.equipment.router import router as equipment_router
from app.routers.photo_upload.router import router as photo_upload_router
from app.routers.inspection_workflow.router import router as inspection_workflow_router
from app.routers.template_management.routes_template_management import router as template_management_router
from app.routers.report_review.router import router as report_review_router
from app.routers.InspectionSchedule.router import router as schedule_router

# ASILLAH's MODULE : AI PHOTO
from app.routers.ai_photo.router import router as ai_photo_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VISOR API",
    description="Visual Inspection Report Automation System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(report_generation_router, prefix="/api")
app.include_router(equipment_router, prefix="/api")
app.include_router(photo_upload_router, prefix="/api")
app.include_router(inspection_workflow_router, prefix="/api")
app.include_router(template_management_router, prefix="/api")
app.include_router(report_review_router, prefix="/api")
app.include_router(ai_photo_router)
app.include_router(schedule_router)

@app.get("/")
def root():
    return {"message": "VISOR API running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Mount static files
from fastapi.staticfiles import StaticFiles
import os

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
