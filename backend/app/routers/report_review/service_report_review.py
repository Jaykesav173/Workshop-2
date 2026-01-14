from datetime import datetime
from app.database.connection import get_db
from app.database import schemas

class ReportReviewService:
    def __init__(self):
        self.db = get_db()
        
    async def get_all_reports(self):
        """Fetch all submitted reports for review"""
        response = self.db.table('Report').select('*').eq('status', 'Submitted').execute()
        return response.data
        
    async def get_report_by_id(self, report_id: str):
        """Fetch report details"""
        response = self.db.table('Report').select('*').eq('report_id', report_id).execute()
        if not response.data:
            return None
        return response.data[0]
        
    async def create_review(self, review_data: schemas.ReportReviewRequest, reviewed_by: int):
        """Submit a QA review and update report status"""
        # Insert QA Comment logic can be expanded here if needed
        # For now, focusing on Status Update as requested
        
        current_time = datetime.utcnow().isoformat()
        
        if review_data.action:
             # Update Report Status
             status_map = {
                 "approve": "APPROVED",
                 "reject": "REJECTED"
             }
             new_status = status_map.get(review_data.action.lower(), "Submitted")
             
             self.db.table('Report').update({
                 "status": new_status,
                 "reviewed_by": reviewed_by,
                 "reviewed_at": current_time,
             }).eq('report_id', review_data.report_id).execute()
             
        return True
