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

