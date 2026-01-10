from fastapi import APIRouter
import importlib.util

# Import routes_report_review using importlib to avoid null byte issues
report_review_routes_spec = importlib.util.spec_from_file_location("report_review_routes", "app/routers/report_review/routes_report_review.py")
report_review_routes_module = importlib.util.module_from_spec(report_review_routes_spec)
report_review_routes_spec.loader.exec_module(report_review_routes_module)
report_review_routes = report_review_routes_module.router

router = APIRouter()
router.include_router(report_review_routes)
# Dashboard routes can be added later if needed
try:
    dashboard_spec = importlib.util.spec_from_file_location("dashboard_routes", "app/routers/report_review/routes_dashboard.py")
    dashboard_module = importlib.util.module_from_spec(dashboard_spec)
    dashboard_spec.loader.exec_module(dashboard_module)
    dashboard_router = dashboard_module.router
    router.include_router(dashboard_router)
except ImportError:
    pass  # Dashboard routes are optional