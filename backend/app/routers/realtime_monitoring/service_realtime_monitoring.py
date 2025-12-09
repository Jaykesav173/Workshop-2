"""
Realtime Monitoring Service - Jay (Module 2, status dashboard)
Business logic for real-time monitoring and status tracking
"""
from fastapi import HTTPException
from app.database.connection import get_db
from datetime import datetime, timedelta

class RealtimeMonitoringService:
    def __init__(self):
        self.db = get_db()
    
    async def get_dashboard_stats(self) -> dict:
        """Get dashboard statistics"""
        try:
            # Get inspection counts by status
            inspections = self.db.table("Inspection").select("status").execute()
            inspection_counts = {}
            if inspections.data:
                for inspection in inspections.data:
                    status = inspection["status"]
                    inspection_counts[status] = inspection_counts.get(status, 0) + 1
            
            # Get report counts by status
            reports = self.db.table("Report").select("status").execute()
            report_counts = {}
            if reports.data:
                for report in reports.data:
                    status = report["status"]
                    report_counts[status] = report_counts.get(status, 0) + 1
            
            # Get recent activity (last 24 hours)
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_inspections = self.db.table("Inspection").select("*").gte("created_at", str(yesterday)).execute()
            
            return {
                "success": True,
                "inspections": {
                    "total": sum(inspection_counts.values()),
                    "by_status": inspection_counts
                },
                "reports": {
                    "total": sum(report_counts.values()),
                    "by_status": report_counts
                },
                "recent_activity": {
                    "inspections_last_24h": len(recent_inspections.data) if recent_inspections.data else 0
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")
    
    async def get_inspection_statuses(self) -> dict:
        """Get all inspection statuses"""
        try:
            res = self.db.table("Inspection").select("id, status, created_at, completed_at").execute()
            return {
                "success": True,
                "inspections": res.data if res.data else []
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching inspection statuses: {str(e)}")
    
    async def get_report_statuses(self) -> dict:
        """Get all report statuses"""
        try:
            res = self.db.table("Report").select("id, status, created_at, validated_at").execute()
            return {
                "success": True,
                "reports": res.data if res.data else []
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching report statuses: {str(e)}")
    
    async def get_alerts(self) -> dict:
        """Get system alerts and notifications"""
        try:
            # Get pending validations
            pending_reports = self.db.table("Report").select("*").eq("status", "PENDING_VALIDATION").execute()
            
            # Get overdue inspections (older than 7 days and not completed)
            week_ago = datetime.utcnow() - timedelta(days=7)
            overdue = self.db.table("Inspection").select("*").lt("created_at", str(week_ago)).neq("status", "COMPLETED").execute()
            
            alerts = []
            if pending_reports.data:
                alerts.append({
                    "type": "PENDING_VALIDATION",
                    "message": f"{len(pending_reports.data)} reports pending validation",
                    "count": len(pending_reports.data)
                })
            
            if overdue.data:
                alerts.append({
                    "type": "OVERDUE_INSPECTION",
                    "message": f"{len(overdue.data)} inspections overdue",
                    "count": len(overdue.data)
                })
            
            return {
                "success": True,
                "alerts": alerts
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")

