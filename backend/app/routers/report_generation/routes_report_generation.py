"""
Report Generation Routes - Abdalla (Module 2, report builder)
API endpoints for generating API 510-compliant inspection reports
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from datetime import datetime
import os
from app.database.schemas import ReportCreate, ReportResponse, API510ReportRequest
from app.routers.report_generation.service_report_generation import ReportGenerationService
from app.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Report Generation"])

report_service = ReportGenerationService()

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    report_data: API510ReportRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate API 510-compliant inspection report with exact PDF formatting
    
    Accepts detailed report structure:
    - header: Equipment info, inspector details, report metadata
    - findings: Numbered findings (e.g., "1.1", "2.3")
    - recommendations: Numbered recommendations
    - photos: Photos with finding keys, finding text, and recommendation text
    """
    try:
        return await report_service.generate_report(report_data, current_user)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n❌ ERROR IN ROUTE HANDLER:")
        print(error_trace)
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}\n\nTraceback:\n{error_trace}")

# IMPORTANT: More specific routes must come BEFORE parameterized routes
@router.get("/equipment/{equipment_id}", response_model=list[ReportResponse])
async def get_equipment_reports(
    equipment_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get all reports for an equipment"""
    return await report_service.get_equipment_reports(equipment_id)

@router.get("/{report_id}/export-pdf")
async def export_report_pdf(report_id: str, current_user: dict = Depends(get_current_user)):
    """Export report in PDF format for submission - returns PDF file"""
    try:
        report = await report_service.get_report(report_id)
        
        if not report.pdf_path:
            raise HTTPException(status_code=404, detail="PDF not generated yet")
        
        if not os.path.exists(report.pdf_path):
            raise HTTPException(status_code=404, detail=f"PDF file not found at: {report.pdf_path}")
        
        # Return the PDF file with proper headers
        return FileResponse(
            path=report.pdf_path,
            media_type="application/pdf",
            filename=os.path.basename(report.pdf_path),
            headers={
                "Content-Disposition": f"attachment; filename={os.path.basename(report.pdf_path)}"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n❌ ERROR EXPORTING PDF:")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error exporting PDF: {str(e)}")

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Get report by report_id (UUID string)"""
    return await report_service.get_report(report_id)

