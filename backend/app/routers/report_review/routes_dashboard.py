"""
Dashboard Routes
API endpoints for Admin and Inspector dashboards
"""
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.routers.report_review.service_report_review import ReportReviewService

# Create a router specifically for dashboard paths
# We don't use a prefix here because we need to handle mixed paths like /reports/summary and /activity/reports
router = APIRouter(tags=["Dashboard"])

report_review_service = ReportReviewService()

@router.get("/reports/summary")
async def get_reports_summary(current_user: dict = Depends(get_current_user)):
    """Get report summary statistics for dashboard"""
    # If not ADMIN, only show own reports
    user_id = None
    if current_user.get("role") != "ADMIN":
        user_id = current_user.get("id")
    
    return await report_review_service.get_reports_summary(user_id)

@router.get("/activity/reports")
async def get_recent_activity(current_user: dict = Depends(get_current_user)):
    """Get recent activities for dashboard"""
    # If not ADMIN, only show own activities
    user_id = None
    if current_user.get("role") != "ADMIN":
        user_id = current_user.get("id")

    return await report_review_service.get_recent_activities(user_id)

# Inspector Dashboard Endpoints
@router.get("/dashboard/user_summary/{user_id}")
async def get_user_summary(user_id: int, current_user: dict = Depends(get_current_user)):
    """Get specific inspector summary"""
    # Reuse summary logic but filter by user
    summary = await report_review_service.get_reports_summary(user_id)
    return {
        "success": True,
        "totalInspections": summary.get("totalReports", 0), 
        "photosUploaded": summary.get("totalPhotos", 0),
        "reportsGenerated": summary.get("totalReports", 0) 
    }

@router.get("/dashboard/reports_by_status/{user_id}")
async def get_user_status(user_id: int, current_user: dict = Depends(get_current_user)):
    summary = await report_review_service.get_reports_summary(user_id)
    return { "success": True, "byStatus": summary.get("byStatus", {}) }

@router.get("/dashboard/reports_trend/{user_id}")
async def get_user_trend(user_id: int, current_user: dict = Depends(get_current_user)):
    summary = await report_review_service.get_reports_summary(user_id)
    return { "success": True, "trend": summary.get("byDate", {}) }

@router.get("/dashboard/recent_activity/{user_id}")
async def get_user_activity(user_id: int, current_user: dict = Depends(get_current_user)):
    activity = await report_review_service.get_recent_activities(user_id)
    return { "success": True, "activities": activity.get("activities", []) }

@router.get("/dashboard/pending_tasks")
async def get_dashboard_tasks(current_user: dict = Depends(get_current_user)):
    """Get urgent pending tasks for the logged in user"""
    tasks = await report_review_service.get_pending_tasks(
        user_id=current_user['id'], 
        role=current_user.get('role', 'Inspector')
    )
    return {"success": True, "tasks": tasks}

