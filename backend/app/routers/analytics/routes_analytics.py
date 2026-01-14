"""
Analytics Routes - Yi Jing (Module 2, historical insights + recommendations)
API endpoints for analytics and insights
"""
from fastapi import APIRouter, Depends, Query
from app.routers.analytics.service_analytics import AnalyticsService
from app.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

analytics_service = AnalyticsService()

@router.get("/insights")
async def get_insights(
    start_date: str = Query(None),
    end_date: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get historical insights"""
    return await analytics_service.get_insights(start_date, end_date)

@router.get("/recommendations")
async def get_recommendations(current_user: dict = Depends(get_current_user)):
    """Get recommendations based on historical data"""
    return await analytics_service.get_recommendations()

@router.get("/trends")
async def get_trends(
    period: str = Query("month"),
    current_user: dict = Depends(get_current_user)
):
    """Get trends over time"""
    return await analytics_service.get_trends(period)

@router.get("/defect-analysis")
async def get_defect_analysis(current_user: dict = Depends(get_current_user)):
    """Get defect analysis and statistics"""
    return await analytics_service.get_defect_analysis()

@router.get("/dashboard/user_summary/{user_id}")
async def get_user_summary(user_id: int):
    """Get dashboard summary for a specific user"""
    return await analytics_service.get_user_summary(user_id)

@router.get("/dashboard/reports_by_status/{user_id}")
async def reports_by_status(user_id: int):
    """Get reports status distribution for a user"""
    return await analytics_service.get_user_reports_status(user_id)

@router.get("/dashboard/reports_trend/{user_id}")
async def reports_trend(user_id: int):
    """Get reports trend for a user"""
    return await analytics_service.get_user_reports_trend(user_id)

@router.get("/dashboard/recent_activity/{user_id}")
async def recent_activity(user_id: int):
    """Get recent activity for a user"""
    return await analytics_service.get_user_recent_activity(user_id)
