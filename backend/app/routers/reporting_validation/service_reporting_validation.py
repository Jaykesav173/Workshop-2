"""
Report History & Review Service - Jay (Module 1)
Business logic for searchable report archive and analytics
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import ReportSearchRequest, ReportResponse
from datetime import datetime, timedelta
import json

class ReportHistoryService:
    def __init__(self):
        self.db = get_db()
    
    async def search_reports(self, search: ReportSearchRequest) -> list[ReportResponse]:
        """Search reports by date, equipment, or inspector"""
        try:
            query = self.db.table("Report").select("*")
            
            # Filter by date range
            if search.start_date:
                query = query.gte("created_at", str(search.start_date))
            if search.end_date:
                query = query.lte("created_at", str(search.end_date))
            
            # Filter by equipment
            if search.equipment_id:
                query = query.eq("equipment_id", search.equipment_id)
            
            # Filter by inspector (created_by)
            if search.inspector_id:
                query = query.eq("created_by", search.inspector_id)
            
            # Filter by status
            if search.status:
                query = query.eq("status", search.status)
            
            # Filter by report type
            if search.report_type:
                query = query.eq("report_type", search.report_type)
            
            res = query.execute()
            
            if res.data:
                return [ReportResponse(**report) for report in res.data]
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error searching reports: {str(e)}")
    
    async def get_inspection_trends(self) -> dict:
        """Get trend analytics for inspection frequency"""
        try:
            # Get all reports
            reports = self.db.table("Report").select("*").execute()
            
            if not reports.data:
                return {
                    "success": True,
                    "trends": {
                        "total_reports": 0,
                        "by_month": {},
                        "by_equipment": {},
                        "inspection_frequency": {}
                    }
                }
            
            # Group by month
            by_month = {}
            by_equipment = {}
            frequency_count = {}
            
            for report in reports.data:
                # Monthly trends
                created_at = datetime.fromisoformat(report.get("created_at", "").replace("Z", "+00:00"))
                month_key = created_at.strftime("%Y-%m")
                by_month[month_key] = by_month.get(month_key, 0) + 1
                
                # By equipment
                if report.get("equipment_id"):
                    eq_id = report["equipment_id"]
                    by_equipment[eq_id] = by_equipment.get(eq_id, 0) + 1
                
                # Inspection frequency
                freq = report.get("inspection_frequency", "UNKNOWN")
                frequency_count[freq] = frequency_count.get(freq, 0) + 1
            
            return {
                "success": True,
                "trends": {
                    "total_reports": len(reports.data),
                    "by_month": by_month,
                    "by_equipment": by_equipment,
                    "inspection_frequency": frequency_count
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching trends: {str(e)}")
    
    async def get_defect_type_summary(self) -> dict:
        """Get summary analytics for defect types"""
        try:
            reports = self.db.table("Report").select("defect_types_summary").execute()
            
            defect_types = {}
            total_defects = 0
            
            if reports.data:
                for report in reports.data:
                    summary = report.get("defect_types_summary")
                    if summary:
                        try:
                            summary_data = json.loads(summary) if isinstance(summary, str) else summary
                            if isinstance(summary_data, dict):
                                for defect_type, count in summary_data.items():
                                    defect_types[defect_type] = defect_types.get(defect_type, 0) + count
                                    total_defects += count
                        except:
                            pass
            
            return {
                "success": True,
                "summary": {
                    "total_defects": total_defects,
                    "by_type": defect_types,
                    "defect_distribution": {
                        k: round((v / total_defects * 100), 2) if total_defects > 0 else 0
                        for k, v in defect_types.items()
                    }
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching defect summary: {str(e)}")
    
    async def get_analytics_summary(self) -> dict:
        """Get comprehensive analytics summary with graphs data"""
        try:
            trends = await self.get_inspection_trends()
            defect_summary = await self.get_defect_type_summary()
            
            # Get reports by status
            reports = self.db.table("Report").select("status").execute()
            by_status = {}
            if reports.data:
                for report in reports.data:
                    status = report.get("status", "UNKNOWN")
                    by_status[status] = by_status.get(status, 0) + 1
            
            return {
                "success": True,
                "analytics": {
                    "inspection_trends": trends.get("trends", {}),
                    "defect_analysis": defect_summary.get("summary", {}),
                    "reports_by_status": by_status,
                    "generated_at": str(datetime.utcnow())
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching analytics summary: {str(e)}")
