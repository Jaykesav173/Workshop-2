"""
Report Review Routes - Yi Jing (Module 2, Report Review and Quality Assurance)
API endpoints for report review and quality assurance
"""

from fastapi import APIRouter, Depends, HTTPException
from app.routers.report_review.service_report_review import ReportReviewService
from app.dependencies import get_current_user
from app.database import schemas

router = APIRouter(prefix="/report-review", tags=["Report Review"])

report_review_service = ReportReviewService()

@router.post("/review")
async def submit_review(review_data: schemas.ReportReviewCreate, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get('id')
        await report_review_service.create_review(review_data, reviewed_by=user_id)
        return {"message": "Review submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=list[schemas.ReportReviewItem])
async def get_reports():
    return await report_review_service.get_all_reports()

@router.get("/{report_id}", response_model=schemas.ReportDetailItem)
async def get_report(report_id: str):
    return await report_review_service.get_report_by_id(report_id)
