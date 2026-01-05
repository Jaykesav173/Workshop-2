"""
QA Review Routes
API endpoints for QA comments and review workflow
"""
from fastapi import APIRouter, Depends, HTTPException
from app.database.schemas import QACommentCreate, QACommentResponse
from app.routers.qa_review.service_qa_review import QAReviewService
from app.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["QA Review"])

qa_service = QAReviewService()

@router.get("/{report_id}/qa-comments", response_model=list[QACommentResponse])
async def get_qa_comments(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all QA comments for a report"""
    return await qa_service.get_comments(report_id)

@router.get("/inspection/{inspection_id}/qa-comments", response_model=list[QACommentResponse])
async def get_qa_comments_by_inspection(
    inspection_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get all QA comments for all reports of an inspection"""
    return await qa_service.get_comments_by_inspection_id(inspection_id)

@router.post("/{report_id}/qa-comments", response_model=QACommentResponse)
async def add_qa_comment(
    report_id: str,
    comment_data: QACommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a QA comment to a report (engineers only)"""
    # Check if user is engineer
    if current_user.get("role", "").upper() != "ENGINEER":
        raise HTTPException(status_code=403, detail="Only engineers can add QA comments")
    
    # Ensure report_id matches
    comment_data.report_id = report_id
    return await qa_service.add_comment(report_id, comment_data, current_user)
