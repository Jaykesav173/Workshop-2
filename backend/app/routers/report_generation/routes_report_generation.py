"""
Report Generation Routes - Abdalla (Module 2, report builder)
API endpoints for generating API 510-compliant inspection reports
"""
from fastapi import APIRouter, Depends
from datetime import datetime
from app.database.schemas import ReportCreate, ReportResponse
from app.routers.report_generation.service_report_generation import ReportGenerationService
from app.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Report Generation"])

report_service = ReportGenerationService()

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    equipment_id: int = None,
    title: str = None,
    content: str = None,
    inspection_date: datetime = None,
    current_user: dict = Depends(get_current_user)
):
    """Generate API 510-compliant inspection report with auto-labeling"""
    return await report_service.generate_report(equipment_id, title, content, inspection_date, current_user)

@router.get("/{report_id}/export-pdf")
async def export_report_pdf(report_id: int, current_user: dict = Depends(get_current_user)):
    """Export report in PDF format for submission"""
    return await report_service.export_report_pdf(report_id)

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, current_user: dict = Depends(get_current_user)):
    """Get report by ID"""
    return await report_service.get_report(report_id)

@router.get("/equipment/{equipment_id}", response_model=list[ReportResponse])
async def get_equipment_reports(
    equipment_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get all reports for an equipment"""
    return await report_service.get_equipment_reports(equipment_id)

