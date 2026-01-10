"""
QA Review Service
Business logic for QA comments and review workflow
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import QACommentCreate, QACommentResponse
from datetime import datetime

class QAReviewService:
    def __init__(self):
        self.db = get_db()
    
    async def get_comments(self, report_id: str) -> list[QACommentResponse]:
        """Get all QA comments for a report"""
        try:
            res = self.db.table("QAComment").select("*").eq("report_id", report_id).order("created_at").execute()
            if res.data:
                return [QACommentResponse(**comment) for comment in res.data]
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching QA comments: {str(e)}")
    
    async def add_comment(self, report_id: str, comment_data: QACommentCreate, current_user: dict) -> QACommentResponse:
        """Add a QA comment to a report"""
        try:
            # Validate section
            valid_sections = ["Header", "Findings", "Photos", "Recommendations", "Conclusion"]
            if comment_data.section not in valid_sections:
                raise HTTPException(status_code=400, detail=f"Invalid section. Must be one of: {valid_sections}")
            
            # Check if report exists and is in reviewable status
            report_res = self.db.table("Report").select("status").eq("report_id", report_id).execute()
            if not report_res.data:
                raise HTTPException(status_code=404, detail="Report not found")
            
            report_status = report_res.data[0].get("status")
            # Make status check case-insensitive
            report_status_upper = str(report_status).upper() if report_status else ""
            # Normalize "NEEDS REVISION" to handle spaces
            report_status_normalized = report_status_upper.replace(" ", "_")
            allowed_statuses = ["SUBMITTED", "QA_REVIEW", "REJECTED", "NEEDS_REVISION", "NEEDSREVISION"]
            if report_status_normalized not in allowed_statuses and report_status_upper not in ["SUBMITTED", "QA_REVIEW", "REJECTED"]:
                raise HTTPException(status_code=400, detail=f"Cannot add comments. Report status: {report_status}")
            
            # Create comment
            comment_record = {
                "report_id": report_id,
                "section": comment_data.section,
                "comment": comment_data.comment,
                "created_by": current_user.get("id"),
                "created_at": str(datetime.utcnow()),
            }
            
            res = self.db.table("QAComment").insert(comment_record).execute()
            if not res.data:
                raise HTTPException(status_code=500, detail="Failed to create comment")
            
            # Update report status to QA_REVIEW if it's SUBMITTED (case-insensitive)
            if report_status_upper == "SUBMITTED":
                self.db.table("Report").update({"status": "QA_REVIEW"}).eq("report_id", report_id).execute()
            
            return QACommentResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error adding QA comment: {str(e)}")
    
    async def get_comments_by_inspection_id(self, inspection_id: int) -> list[QACommentResponse]:
        """Get all QA comments for all reports of an inspection"""
        try:
            # First get all reports for this inspection
            reports_res = self.db.table("Report").select("report_id").eq("inspection_id", inspection_id).execute()
            if not reports_res.data:
                return []
            
            # Get all report_ids
            report_ids = [r.get("report_id") for r in reports_res.data if r.get("report_id")]
            if not report_ids:
                return []
            
            # Get all comments for all reports
            all_comments = []
            for report_id in report_ids:
                comments_res = self.db.table("QAComment").select("*").eq("report_id", report_id).order("created_at").execute()
                if comments_res.data:
                    all_comments.extend(comments_res.data)
            
            # Sort by created_at
            all_comments.sort(key=lambda x: x.get("created_at", ""))
            
            if all_comments:
                return [QACommentResponse(**comment) for comment in all_comments]
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching QA comments by inspection: {str(e)}")
