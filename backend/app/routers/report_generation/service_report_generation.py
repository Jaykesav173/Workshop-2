"""
Report Generation Service - Abdalla (Intelligent Report Generation)
Business logic for generating API 510-compliant reports with auto-labeling and PDF export
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import ReportResponse
from app.config import settings
from datetime import datetime, timedelta
import os
import json

class ReportGenerationService:
    def __init__(self):
        self.db = get_db()
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    
    async def generate_report(
        self, 
        equipment_id: int = None, 
        title: str = None, 
        content: str = None, 
        inspection_date: datetime = None,
        current_user: dict = None
    ) -> ReportResponse:
        """
        Generate API 510-compliant inspection report
        Automatically compiles processed data, photos, and findings
        Auto-labels photos and defects
        Inserts inspector and equipment info dynamically
        """
        try:
            # Get equipment data if provided
            equipment_data = None
            if equipment_id:
                equipment_res = self.db.table("Equipment").select("*").eq("id", equipment_id).execute()
                if equipment_res.data:
                    equipment_data = equipment_res.data[0]
            
            # Get inspector (user) data
            inspector_data = None
            if current_user:
                user_res = self.db.table("User").select("*").eq("id", current_user.get("id")).execute()
                if user_res.data:
                    inspector_data = user_res.data[0]
            
            # Get photos for this equipment if provided
            photos = []
            labeled_photos = []
            if equipment_id:
                photos_res = self.db.table("Photo").select("*").eq("equipment_id", equipment_id).execute()
                photos = photos_res.data if photos_res.data else []
                
                # Auto-label photos
                for photo in photos:
                    labeled_photo = {
                        "photo_id": photo.get("id"),
                        "file_name": photo.get("file_name"),
                        "label": f"Equipment {equipment_data.get('name', 'Unknown')} - Photo {photo.get('id')}",
                        "uploaded_at": photo.get("uploaded_at"),
                        "storage_url": photo.get("storage_url")
                    }
                    labeled_photos.append(labeled_photo)
            
            # Get defects from image processing (if available)
            # Note: Defects would come from image_processing module
            labeled_defects = []
            defect_types_summary = {}
            
            # TODO: Integrate with image_processing module to get actual defects
            # For now, placeholder structure
            # labeled_defects = await self._get_defects_from_photos(photos)
            
            # Calculate inspection frequency
            if equipment_id:
                previous_reports = self.db.table("Report").select("*").eq("equipment_id", equipment_id).execute()
                inspection_frequency = self._calculate_inspection_frequency(previous_reports.data if previous_reports.data else [])
            else:
                inspection_frequency = "N/A"
            
            # Generate report data with API 510 compliance
            report_data = {
                "equipment": equipment_data,
                "inspector": {
                    "id": inspector_data.get("id") if inspector_data else None,
                    "name": inspector_data.get("name") if inspector_data else "Unknown",
                    "role": inspector_data.get("role") if inspector_data else "INSPECTOR"
                } if inspector_data else None,
                "inspection_date": str(inspection_date) if inspection_date else str(datetime.utcnow()),
                "photos": labeled_photos,
                "defects": labeled_defects,
                "generated_at": str(datetime.utcnow()),
                "api_510_compliant": True
            }
            
            # Save as JSON
            report_filename = f"report_{equipment_id or 'general'}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
            report_path = os.path.join(settings.REPORTS_DIR, report_filename)
            
            with open(report_path, "w") as f:
                json.dump(report_data, f, indent=2)
            
            # Generate PDF (TODO: Implement PDF generation library like reportlab or weasyprint)
            pdf_path = await self._generate_pdf_report(report_data, report_filename)
            
            # Save to database
            report_record = {
                "equipment_id": equipment_id,
                "created_by": current_user.get("id") if current_user else None,
                "report_path": report_path,
                "report_url": None,  # TODO: Upload to Supabase storage
                "pdf_path": pdf_path,
                "pdf_url": None,  # TODO: Upload PDF to Supabase storage
                "report_type": "API_510",
                "title": title or f"API 510 Inspection Report - {equipment_data.get('name', 'Equipment') if equipment_data else 'General'}",
                "content": content or json.dumps(report_data, indent=2),
                "api_510_compliant": "YES",
                "inspection_date": str(inspection_date) if inspection_date else str(datetime.utcnow()),
                "next_inspection_due": str(self._calculate_next_inspection_due(inspection_date, inspection_frequency)) if inspection_date else None,
                "labeled_photos": json.dumps(labeled_photos),
                "labeled_defects": json.dumps(labeled_defects),
                "inspection_frequency": inspection_frequency,
                "defect_types_summary": json.dumps(defect_types_summary),
                "status": "COMPLETED",
                "created_at": str(datetime.utcnow())
            }
            
            res = self.db.table("Report").insert(report_record).execute()
            
            if res.data:
                return ReportResponse(**res.data[0])
            else:
                raise HTTPException(status_code=400, detail="Failed to generate report")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")
    
    async def _generate_pdf_report(self, report_data: dict, base_filename: str) -> str:
        """Generate PDF report for API 510 submission"""
        # TODO: Implement PDF generation using reportlab or weasyprint
        # For now, return path placeholder
        pdf_filename = base_filename.replace(".json", ".pdf")
        pdf_path = os.path.join(settings.REPORTS_DIR, pdf_filename)
        
        # Placeholder - actual PDF generation would go here
        # Example structure:
        # - API 510 header
        # - Equipment information
        # - Inspector information
        # - Inspection date
        # - Labeled photos with captions
        # - Labeled defects with descriptions
        # - Compliance status
        # - Next inspection due date
        
        return pdf_path
    
    def _calculate_inspection_frequency(self, previous_reports: list) -> str:
        """Calculate inspection frequency based on previous reports"""
        if not previous_reports or len(previous_reports) < 2:
            return "ANNUAL"  # Default
        
        # Calculate average time between inspections
        dates = []
        for report in previous_reports:
            if report.get("inspection_date"):
                dates.append(datetime.fromisoformat(report["inspection_date"].replace("Z", "+00:00")))
        
        if len(dates) < 2:
            return "ANNUAL"
        
        dates.sort()
        total_days = (dates[-1] - dates[0]).days
        avg_days = total_days / (len(dates) - 1)
        
        if avg_days < 90:
            return "QUARTERLY"
        elif avg_days < 180:
            return "BIANNUAL"
        else:
            return "ANNUAL"
    
    def _calculate_next_inspection_due(self, inspection_date: datetime, frequency: str) -> datetime:
        """Calculate next inspection due date"""
        if not inspection_date:
            inspection_date = datetime.utcnow()
        
        if frequency == "QUARTERLY":
            return inspection_date + timedelta(days=90)
        elif frequency == "BIANNUAL":
            return inspection_date + timedelta(days=180)
        else:  # ANNUAL
            return inspection_date + timedelta(days=365)
    
    async def export_report_pdf(self, report_id: int) -> dict:
        """Export report in PDF format for submission"""
        try:
            report = await self.get_report(report_id)
            
            if not report.pdf_path or not os.path.exists(report.pdf_path):
                raise HTTPException(status_code=404, detail="PDF not generated yet")
            
            return {
                "success": True,
                "pdf_path": report.pdf_path,
                "pdf_url": report.pdf_url,
                "message": "PDF ready for submission"
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error exporting PDF: {str(e)}")
    
    async def get_report(self, report_id: int) -> ReportResponse:
        """Get report by ID"""
        try:
            res = self.db.table("Report").select("*").eq("id", report_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Report not found")
            return ReportResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching report: {str(e)}")
    
    async def get_equipment_reports(self, equipment_id: int) -> list[ReportResponse]:
        """Get all reports for an equipment"""
        try:
            res = self.db.table("Report").select("*").eq("equipment_id", equipment_id).execute()
            if res.data:
                return [ReportResponse(**report) for report in res.data]
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")
