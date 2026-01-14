"""
Report Generation Routes - Abdalla (Module 2, report builder)
API endpoints for generating API 510-compliant inspection reports
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from datetime import datetime
import os
from app.database.schemas import ReportCreate, ReportResponse, API510ReportRequest, ReportReviewRequest, ReportSearchRequest
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

# Specific routes must come before /{report_id} route
@router.get("/submitted", response_model=list[ReportResponse])
async def get_submitted_reports(current_user: dict = Depends(get_current_user)):
    """Get all submitted reports for QA review (engineers only)"""
    # Check if user is engineer
    if current_user.get("role", "").upper() != "ENGINEER":
        raise HTTPException(status_code=403, detail="Only engineers can view submitted reports")
    return await report_service.get_submitted_reports()

@router.get("/my-notifications")
async def get_my_report_notifications(current_user: dict = Depends(get_current_user)):
    """Fast endpoint for fetching my report notifications"""
    return await report_service.get_my_reports(current_user["id"], current_user.get("username", ""))

@router.get("/all", response_model=list[ReportResponse])
async def get_all_reports(current_user: dict = Depends(get_current_user)):
    """Get all reports with all statuses (for dashboard statistics)"""
    return await report_service.get_all_reports()

@router.get("/history/archive", response_model=list[ReportResponse])
async def get_report_archive(current_user: dict = Depends(get_current_user)):
    """
    Get all reports history/archive.
    Used by Engineer/Admin Dashboards as fallback or primary data source.
    """
    return await report_service.get_all_reports()

@router.post("/history/search", response_model=list[ReportResponse])
async def search_reports_history(
    search_data: ReportSearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Search reports history.
    Currently returns all reports (simple implementation for fallback compatibility).
    """
    # TODO: Implement actual filtering logic in service layer if needed in future
    return await report_service.get_all_reports()

@router.get("/inspection/{inspection_id}")
async def get_report_by_inspection_id(inspection_id: int, current_user: dict = Depends(get_current_user)):
    """Get report by inspection_id - returns 200 with { report: null } if no report exists"""
    try:
        if inspection_id is None:
            return {"report": None}
        report = await report_service.get_report_by_inspection_id(inspection_id)
        return {"report": report.model_dump() if report else None}
    except Exception as e:
        print(f"⚠️ Error in get_report_by_inspection_id for inspection {inspection_id}: {e}")
        import traceback
        print(traceback.format_exc())
        return {"report": None}

# Parameterized routes come after specific routes
@router.get("/{report_id}/export-pdf")
async def export_report_pdf(report_id: str, current_user: dict = Depends(get_current_user)):
    """Export report in PDF format for submission - returns PDF file"""
    try:
        report = await report_service.get_report(report_id)
        
        # 1. Try serving from local file if it exists
        if report.pdf_path and os.path.exists(report.pdf_path):
            return FileResponse(
                path=report.pdf_path,
                media_type="application/pdf",
                filename=os.path.basename(report.pdf_path),
                headers={
                    "Content-Disposition": f"attachment; filename={os.path.basename(report.pdf_path)}"
                }
            )
            
        # 2. If local file missing, try to serve from Cloud URL
        if report.pdf_url:
            print(f"⚠️ Local PDF not found, fetching from Cloud: {report.pdf_url}")
            try:
                import requests
                from fastapi.responses import Response
                response = requests.get(report.pdf_url)
                if response.status_code == 200:
                    filename = f"API510_Report_{report.report_no or report_id}.pdf"
                    return Response(
                        content=response.content,
                        media_type="application/pdf",
                        headers={
                            "Content-Disposition": f"attachment; filename={filename}"
                        }
                    )
            except Exception as e:
                 print(f"❌ Failed to fetch from cloud: {e}")

        # 3. If neither available, raise 404
        if not report.pdf_path:
             raise HTTPException(status_code=404, detail="PDF not generated yet")
        
        raise HTTPException(status_code=404, detail=f"PDF file not found locally or in cloud")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n❌ ERROR EXPORTING PDF:")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error exporting PDF: {str(e)}")

@router.post("/{report_id}/submit", response_model=ReportResponse)
async def submit_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Submit report for QA review"""
    return await report_service.submit_report(report_id, current_user)

@router.post("/{report_id}/review", response_model=ReportResponse)
async def review_report(
    report_id: str,
    review_data: ReportReviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """Review report (approve or reject) - engineers only"""
    # Check if user is engineer
    if current_user.get("role", "").upper() != "ENGINEER":
        raise HTTPException(status_code=403, detail="Only engineers can review reports")
    return await report_service.review_report(
        report_id,
        review_data.action,
        review_data.comment or "",
        current_user
    )

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Get report by report_id (UUID string)"""
    return await report_service.get_report(report_id)
