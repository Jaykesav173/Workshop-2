"""
Report Review Service - Yi Jing (Module 2, Report Review and Quality Assurance)
Business logic for report review and quality assurance
"""

from app.database.connection import get_db
from app.database.schemas import ReportReviewItem
from app.database import schemas
from datetime import datetime
from typing import List, Optional, Dict

class ReportReviewService:
    def __init__(self):
        self.db = get_db()

    async def get_all_reports(self) -> List[ReportReviewItem]:
        try:
            # Fetch specific columns to avoid timeout on large JSON fields
            # We avoid fetching 'content', 'labeled_photos', etc.
            columns = "report_id, title, inspection_date, equipment_id, created_by, created_at, status"
            res = self.db.table("Report").select(columns).order("created_at", desc=True).limit(50).execute()
            
            reports = []
            if res.data:
                reports_data = res.data
                
                # Extract IDs for batch fetching
                equipment_ids = list(set([r.get('equipment_id') for r in reports_data if r.get('equipment_id')]))
                user_ids = list(set([r.get('created_by') for r in reports_data if r.get('created_by')]))
                
                # Fetch Equipment details
                equipment_map = {}
                if equipment_ids:
                    try:
                        # Using 'equipment' (lowercase) based on service_equipment.py
                        eq_res = self.db.table("equipment").select("id, equipment_tag_no, location").in_("id", equipment_ids).execute()
                        if eq_res.data:
                            equipment_map = {e['id']: e for e in eq_res.data}
                    except Exception as e:
                        print(f"Error fetching equipment details: {e}")

                # Fetch User details
                user_map = {}
                if user_ids:
                    try:
                        # Using 'User' (PascalCase) based on service_auth.py
                        user_res = self.db.table("User").select("id, name").in_("id", user_ids).execute()
                        if user_res.data:
                            user_map = {u['id']: u for u in user_res.data}
                    except Exception as e:
                        print(f"Error fetching user details: {e}")

                for r in reports_data:
                    eq_id = r.get("equipment_id")
                    user_id = r.get("created_by")
                    
                    eq_data = equipment_map.get(eq_id)
                    user_data = user_map.get(user_id)
                    
                    tag = eq_data.get("equipment_tag_no") if eq_data else None
                    location = eq_data.get("location") if eq_data else None
                    inspector = user_data.get("name") if user_data else "Unknown"

                    item = ReportReviewItem(
                        report_id=r.get("report_id"),
                        report_title=r.get("title", "Untitled Report"),
                        inspection_date=r.get("inspection_date"),
                        equipment_tag=tag,
                        equipment_location=location,
                        inspector_name=inspector,
                        created_at=r.get("created_at"),
                        status=r.get("status", "Draft")
                    )
                    reports.append(item)
            return reports

            return reports

        except Exception as e:
            print(f"Error fetching reports: {e}")
            # Return empty list on error
            return []

    async def get_report_by_id(self, report_id: str) -> Optional[ReportReviewItem]:
        try:
            # 1. Fetch Report
            res = self.db.table("Report").select("*").eq("report_id", report_id).single().execute()
            if not res.data:
                return None
            
            r = res.data
            
            # 2. Fetch Equipment
            eq_id = r.get("equipment_id")
            tag = None
            location = None
            eq_desc = None
            dosh_no = None
            
            if eq_id:
                try:
                    eq_res = self.db.table("equipment").select("*").eq("id", eq_id).single().execute()
                    if eq_res.data:
                        eq_data = eq_res.data
                        tag = eq_data.get("equipment_tag_no")
                        location = eq_data.get("location")
                        eq_desc = eq_data.get("equipment_description")
                        dosh_no = eq_data.get("dosh_registration_no")
                except Exception as e:
                    print(f"Error fetching equipment for report {report_id}: {e}")

            # 3. Fetch User (Inspector)
            user_id = r.get("created_by")
            inspector = "Unknown"
            
            if user_id:
                try:
                    user_res = self.db.table("User").select("id, name").eq("id", user_id).single().execute()
                    if user_res.data:
                        inspector = user_res.data.get("name")
                except Exception as e:
                    print(f"Error fetching user for report {report_id}: {e}")

            # 4. Construct Response
            # We import ReportDetailItem inside method to avoid circular imports if any, 
            # or just rely on the file import if it's already there (it is not imported yet).
            from app.database.schemas import ReportDetailItem

            item = ReportDetailItem(
                report_id=r.get("report_id"),
                report_title=r.get("title", "Untitled Report"),
                inspection_date=r.get("inspection_date"),
                equipment_tag=tag,
                equipment_location=location,
                inspector_name=inspector,
                created_at=r.get("created_at"),
                status=r.get("status", "Draft"),
                
                # Detail fields
                content=r.get("content"),
                labeled_photos=r.get("labeled_photos"),
                labeled_defects=r.get("labeled_defects"),
                defect_types_summary=r.get("defect_types_summary"),
                report_type=r.get("report_type"),
                pdf_url=r.get("pdf_url"),
                report_url=r.get("report_url"),
                api_510_compliant=r.get("api_510_compliant", False),
                equipment_description=eq_desc,
                dosh_registration_no=dosh_no
            )
            return item

        except Exception as e:
            print(f"Error fetching report {report_id}: {e}")
            return None

    async def create_review(self, review_data: schemas.ReportReviewCreate, reviewed_by: int):
        try:
            # 1. Insert Review Record
            review_entry = {
                "report_id": review_data.report_id,
                "reviewed_by": reviewed_by,
                "status": review_data.status,
                "reviewed_at": datetime.utcnow().isoformat()
            }
            
            res = self.db.table("report_review").insert(review_entry).execute()
            
            if not res.data:
                raise Exception("Failed to create review record")
                
            review_id = res.data[0]['review_id']
            
            # 2. Insert Feedback Items (if any)
            if review_data.feedback_items:
                feedback_entries = []
                for item in review_data.feedback_items:
                    feedback_entries.append({
                        "review_id": review_id,
                        "section_name": item.section_name,
                        "feedback": item.feedback
                    })
                
                if feedback_entries:
                    self.db.table("section_feedback").insert(feedback_entries).execute()

            # 3. Update Report Status
            # If rejected, set report status to 'Needs Revision'
            # If approved, set report status to 'Approved'
            new_status = "NEEDS REVISION" if review_data.status == "Rejected" else "APPROVED"
            
            # Use Report ID string directly as per schema fix
            self.db.table("Report").update({"status": new_status}).eq("report_id", review_data.report_id).execute()

            return True

        except Exception as e:
            print(f"Error creating review: {e}")
            raise e
