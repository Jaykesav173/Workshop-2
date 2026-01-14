import logging
import os
import importlib.util
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings

from app.routers.auth.router import router as auth_router
from app.routers.report_generation.router import router as report_generation_router
from app.routers.equipment.router import router as equipment_router
from app.routers.photo_upload.router import router as photo_upload_router
from app.routers.inspection_workflow.router import router as inspection_workflow_router
from app.routers.user_roles.routes_user_roles import router as user_roles_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import ai_photo router using importlib to avoid null byte issues
try:
    ai_photo_spec = importlib.util.spec_from_file_location("ai_photo_router", "app/routers/ai_photo/router.py")
    ai_photo_module = importlib.util.module_from_spec(ai_photo_spec)
    ai_photo_spec.loader.exec_module(ai_photo_module)
    ai_photo_router = ai_photo_module.router
    logger.info(f"Successfully loaded ai_photo router with {len(ai_photo_router.routes)} routes")
except Exception as e:
    logger.error(f"Failed to load ai_photo router: {e}")
    import traceback
    logger.error(traceback.format_exc())
    ai_photo_router = None

# Import routers using importlib to avoid null byte issues
try:
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    router_path = os.path.join(current_dir, "routers", "InspectionSchedule", "router.py")
    schedule_spec = importlib.util.spec_from_file_location("schedule_router", router_path)
    schedule_module = importlib.util.module_from_spec(schedule_spec)
    schedule_spec.loader.exec_module(schedule_module)
    schedule_router = schedule_module.router
    logger.info("✅ schedule router imported successfully via importlib")
except Exception as e:
    logger.warning(f"Failed to load schedule router: {e}")
    schedule_router = None

from app.routers.template_management.routes_template import router as template_management_router

# Import QA review router
try:
    from app.routers.qa_review.routes_qa_review import router as qa_review_router
    logger.info("✅ Successfully loaded qa_review router")
except Exception as e:
    logger.warning(f"Failed to load qa_review router: {e}")
    import traceback
    logger.warning(traceback.format_exc())
    qa_review_router = None

try:
    report_review_spec = importlib.util.spec_from_file_location("report_review_router", "app/routers/report_review/router.py")
    report_review_module = importlib.util.module_from_spec(report_review_spec)
    report_review_spec.loader.exec_module(report_review_module)
    report_review_router = report_review_module.router
except Exception as e:
    logger.warning(f"Failed to load report_review router: {e}")
    report_review_router = None

app = FastAPI(
    title="VISOR API",
    description="Visual Inspection Report Automation System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Ensure upload directory exists
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)

# Mount static files
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
# Mount assets directory for logos/static content
assets_dir = os.path.join(os.path.dirname(__file__), "assets")
if os.path.exists(assets_dir):
    app.mount("/static/assets", StaticFiles(directory=assets_dir), name="assets")

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(report_generation_router, prefix="/api")
app.include_router(equipment_router, prefix="/api")
app.include_router(photo_upload_router, prefix="/api")
app.include_router(inspection_workflow_router, prefix="/api")
app.include_router(user_roles_router, prefix="/api")
app.include_router(template_management_router, prefix="/api")
if qa_review_router:
    app.include_router(qa_review_router, prefix="/api")
    logger.info("✅ qa_review router included in app")
if report_review_router:
    app.include_router(report_review_router, prefix="/api")
if ai_photo_router:
    app.include_router(ai_photo_router)  # No /api prefix, uses /ai_photo directly
    logger.info("✅ ai_photo router included in app")
else:
    logger.warning("⚠️ ai_photo router is None, not including in app")
if schedule_router:
    app.include_router(schedule_router)  # No /api prefix, uses /schedules directly
    logger.info("✅ schedule router included in app")

# Import and include notifications router
try:
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    notif_router_path = os.path.join(current_dir, "routers", "notifications", "router.py")
    notif_spec = importlib.util.spec_from_file_location("notifications_router", notif_router_path)
    notif_module = importlib.util.module_from_spec(notif_spec)
    notif_spec.loader.exec_module(notif_module)
    notifications_router = notif_module.router
    app.include_router(notifications_router, prefix="/api")
    logger.info("✅ notifications router included in app")
except Exception as e:
    logger.warning(f"Failed to load notifications router: {e}")

@app.get("/")
def root():
    return {"message": "VISOR API running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Log all registered routes after all routers are included
@app.on_event("startup")
async def startup_event():
    """Log all registered routes on startup"""
    logger.info("=" * 50)
    logger.info("Registered API Routes:")
    for route in app.routes:
        if hasattr(route, 'path'):
            methods = []
            if hasattr(route, 'methods'):
                methods = [m for m in route.methods if m != 'HEAD']
            elif hasattr(route, 'methods') and route.methods:
                methods = list(route.methods)
            path = route.path
            logger.info(f"  {', '.join(methods) if methods else 'GET':<15} {path}")
    logger.info("=" * 50)
