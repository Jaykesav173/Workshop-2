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
            # Only select essential fields - exclude large JSON fields (content, labeled_photos, labeled_defects)
            # These can be fetched separately if needed for detail view
            query = self.db.table("Report").select(
                "report_id,"
                "inspection_id,"
                "equipment_id,"
                "created_by,"
                "title,"
                "report_type,"
                "status,"
                "api_510_compliant,"
                "inspection_date,"
                "next_inspection_due,"
                "inspection_frequency,"
                "defect_types_summary,"
                "report_path,"
                "report_url,"
                "pdf_path,"
                "pdf_url,"
                "created_at"
            )
            
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
            
            # Order by created_at descending and limit to prevent timeout
            # Limit first to reduce data transfer, then sort
            query = query.limit(1000)
            
            res = query.execute()
            
            if res.data:
                # Sort by created_at descending (newest first) in Python
                # This avoids potential issues with Supabase order syntax
                sorted_data = sorted(
                    res.data, 
                    key=lambda x: x.get('created_at') or '', 
                    reverse=True
                )
                
                reports = []
                for db_record in sorted_data:
                    # Skip records missing required fields
                    if not db_record.get('report_id'):
                        continue
                    
                    # Set default values for missing fields - ensure required fields are not None
                    report_type = db_record.get('report_type')
                    if not report_type or report_type is None:
                        report_type = 'API_510'
                    
                    created_by = db_record.get('created_by')
                    if created_by is None:
                        created_by = 0  # Default to 0 if not set
                    else:
                        # Ensure it's an integer
                        try:
                            created_by = int(created_by)
                        except (ValueError, TypeError):
                            created_by = 0
                    
                    status = db_record.get('status')
                    if not status or status is None:
                        status = 'DRAFT'
                    
                    # Handle created_at - required field
                    created_at = db_record.get('created_at')
                    if not created_at:
                        # Skip records without created_at
                        continue
                    
                    # Handle api_510_compliant conversion
                    api_510_value = db_record.get('api_510_compliant')
                    if api_510_value is None:
                        api_510_value = False
                    elif isinstance(api_510_value, bool):
                        pass  # Already boolean
                    elif isinstance(api_510_value, str):
                        api_510_value = api_510_value.lower() in ('true', 'yes', '1')
                    else:
                        api_510_value = bool(api_510_value)
                    
                    response_data = {
                        'report_id': str(db_record.get('report_id')),  # Ensure it's a string
                        'inspection_id': db_record.get('inspection_id'),
                        'equipment_id': db_record.get('equipment_id'),
                        'created_by': created_by,  # Ensure it's not None and is int
                        'title': db_record.get('title'),
                        'report_type': report_type,  # Ensure it's not None
                        'status': status,  # Ensure it's not None
                        'api_510_compliant': api_510_value,
                        'inspection_date': db_record.get('inspection_date'),
                        'next_inspection_due': db_record.get('next_inspection_due'),
                        'inspection_frequency': db_record.get('inspection_frequency'),
                        'defect_types_summary': db_record.get('defect_types_summary'),
                        'report_path': db_record.get('report_path'),
                        'report_url': db_record.get('report_url'),
                        'pdf_path': db_record.get('pdf_path'),
                        'pdf_url': db_record.get('pdf_url'),
                        'created_at': created_at,  # Required field
                        'updated_at': None,  # Column doesn't exist in Report table
                        'content': None,  # Excluded from list view
                        'labeled_photos': None,  # Excluded from list view
                        'labeled_defects': None,  # Excluded from list view
                    }
                    reports.append(ReportResponse(**response_data))
                return reports
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error searching reports: {str(e)}")
    
    async def get_inspection_trends(self) -> dict:
        """Get trend analytics for inspection frequency"""
        try:
            # Only select fields needed for analytics - exclude large JSON fields
            reports = self.db.table("Report").select(
                "created_at,equipment_id,inspection_frequency"
            ).limit(5000).execute()
            
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
                try:
                    created_at_str = report.get("created_at", "")
                    if created_at_str:
                        # Handle different date formats
                        if isinstance(created_at_str, str):
                            created_at_str = created_at_str.replace("Z", "+00:00")
                            created_at = datetime.fromisoformat(created_at_str)
                        elif isinstance(created_at_str, datetime):
                            created_at = created_at_str
                        else:
                            continue
                        month_key = created_at.strftime("%Y-%m")
                        by_month[month_key] = by_month.get(month_key, 0) + 1
                except Exception as e:
                    # Skip invalid dates
                    continue
                
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
            
            # Get reports by status - only select status field
            reports = self.db.table("Report").select("status").limit(5000).execute()
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