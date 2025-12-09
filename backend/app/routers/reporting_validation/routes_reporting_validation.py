"""
Report History & Review Routes - Jay (Module 1)
API endpoints for searchable report archive and analytics
"""
from fastapi import APIRouter, Depends, Query
from app.routers.reporting_validation.service_reporting_validation import ReportHistoryService
from app.database.schemas import ReportSearchRequest, ReportResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/reports/history", tags=["Report History & Review"])

history_service = ReportHistoryService()

@router.post("/search", response_model=list[ReportResponse])
async def search_reports(
    search: ReportSearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """Search reports by date, equipment, or inspector"""
    return await history_service.search_reports(search)

@router.get("/archive", response_model=list[ReportResponse])
async def get_report_archive(
    start_date: str = Query(None),
    end_date: str = Query(None),
    equipment_id: int = Query(None),
    inspector_id: int = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get searchable report archive with filters"""
    search = ReportSearchRequest(
        start_date=start_date,
        end_date=end_date,
        equipment_id=equipment_id,
        inspector_id=inspector_id
    )
    return await history_service.search_reports(search)

@router.get("/analytics/trends")
async def get_inspection_trends(current_user: dict = Depends(get_current_user)):
    """Get trend analytics for inspection frequency"""
    return await history_service.get_inspection_trends()

@router.get("/analytics/defect-types")
async def get_defect_type_analytics(current_user: dict = Depends(get_current_user)):
    """Get summary analytics for defect types"""
    return await history_service.get_defect_type_summary()

@router.get("/analytics/summary")
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    """Get comprehensive analytics summary with graphs data"""
    return await history_service.get_analytics_summary()

