"""
Realtime Monitoring Routes - Jay (Module 2, status dashboard)
API endpoints for real-time inspection status monitoring
"""
from fastapi import APIRouter, Depends
from app.routers.realtime_monitoring.service_realtime_monitoring import RealtimeMonitoringService
from app.dependencies import get_current_user

router = APIRouter(prefix="/monitoring", tags=["Realtime Monitoring"])

monitoring_service = RealtimeMonitoringService()

@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    return await monitoring_service.get_dashboard_stats()

@router.get("/inspections/status")
async def get_inspection_statuses(current_user: dict = Depends(get_current_user)):
    """Get all inspection statuses"""
    return await monitoring_service.get_inspection_statuses()

@router.get("/reports/status")
async def get_report_statuses(current_user: dict = Depends(get_current_user)):
    """Get all report statuses"""
    return await monitoring_service.get_report_statuses()

@router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    """Get system alerts and notifications"""
    return await monitoring_service.get_alerts()

