"""
Analytics Service - Yi Jing (Module 2, historical insights + recommendations)
Business logic for analytics and historical data analysis
"""
from fastapi import HTTPException
from app.database.connection import get_db
from datetime import datetime, timedelta

class AnalyticsService:
    def __init__(self):
        self.db = get_db()
    
    async def get_insights(self, start_date: str = None, end_date: str = None) -> dict:
        """Get historical insights"""
        try:
            # Get inspection statistics
            inspections = self.db.table("Inspection").select("*").execute()
            
            # Get defect statistics
            defects = self.db.table("Defect").select("*").execute()
            
            # Calculate insights
            total_inspections = len(inspections.data) if inspections.data else 0
            completed_inspections = len([i for i in (inspections.data or []) if i.get("status") == "COMPLETED"])
            total_defects = len(defects.data) if defects.data else 0
            
            # Defect type distribution
            defect_types = {}
            if defects.data:
                for defect in defects.data:
                    defect_type = defect.get("defect_type", "UNKNOWN")
                    defect_types[defect_type] = defect_types.get(defect_type, 0) + 1
            
            return {
                "success": True,
                "insights": {
                    "total_inspections": total_inspections,
                    "completed_inspections": completed_inspections,
                    "completion_rate": (completed_inspections / total_inspections * 100) if total_inspections > 0 else 0,
                    "total_defects_detected": total_defects,
                    "defect_type_distribution": defect_types,
                    "average_defects_per_inspection": (total_defects / total_inspections) if total_inspections > 0 else 0
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching insights: {str(e)}")
    
    async def get_recommendations(self) -> dict:
        """Get recommendations based on historical data"""
        try:
            recommendations = []
            
            # Get equipment with most defects
            defects = self.db.table("Defect").select("photo_id").execute()
            if defects.data:
                # TODO: Join with photos and inspections to get equipment
                recommendations.append({
                    "type": "EQUIPMENT_MAINTENANCE",
                    "message": "Consider scheduling maintenance for equipment with frequent defects",
                    "priority": "HIGH"
                })
            
            # Get pending validations
            pending_reports = self.db.table("Report").select("*").eq("status", "PENDING_VALIDATION").execute()
            if pending_reports.data and len(pending_reports.data) > 5:
                recommendations.append({
                    "type": "VALIDATION_BACKLOG",
                    "message": f"{len(pending_reports.data)} reports pending validation",
                    "priority": "MEDIUM"
                })
            
            return {
                "success": True,
                "recommendations": recommendations
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching recommendations: {str(e)}")
    
    async def get_trends(self, period: str = "month") -> dict:
        """Get trends over time"""
        try:
            # Calculate date range based on period
            if period == "week":
                start_date = datetime.utcnow() - timedelta(weeks=1)
            elif period == "month":
                start_date = datetime.utcnow() - timedelta(days=30)
            else:
                start_date = datetime.utcnow() - timedelta(days=30)
            
            # Get inspections in period
            inspections = self.db.table("Inspection").select("*").gte("created_at", str(start_date)).execute()
            
            # Get defects in period
            defects = self.db.table("Defect").select("*").gte("detected_at", str(start_date)).execute()
            
            return {
                "success": True,
                "period": period,
                "trends": {
                    "inspections": len(inspections.data) if inspections.data else 0,
                    "defects": len(defects.data) if defects.data else 0
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching trends: {str(e)}")
    
    async def get_defect_analysis(self) -> dict:
        """Get defect analysis and statistics"""
        try:
            defects = self.db.table("Defect").select("*").execute()
            
            if not defects.data:
                return {
                    "success": True,
                    "analysis": {
                        "total_defects": 0,
                        "by_type": {},
                        "average_confidence": 0
                    }
                }
            
            # Analyze defects
            by_type = {}
            total_confidence = 0
            
            for defect in defects.data:
                defect_type = defect.get("defect_type", "UNKNOWN")
                by_type[defect_type] = by_type.get(defect_type, 0) + 1
                total_confidence += defect.get("confidence_score", 0) or 0
            
            avg_confidence = total_confidence / len(defects.data) if defects.data else 0
            
            return {
                "success": True,
                "analysis": {
                    "total_defects": len(defects.data),
                    "by_type": by_type,
                    "average_confidence": round(avg_confidence, 2)
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching defect analysis: {str(e)}")

