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
            columns = "report_id, title, inspection_date, equipment_id, created_by, created_at, status"
            res = self.db.table("Report").select(columns).order("created_at", desc=True).limit(50).execute()
            
            print(f"📋 get_all_reports: Fetched {len(res.data) if res.data else 0} reports from DB")
            if res.data and len(res.data) > 0:
                print(f"📋 Latest report ID: {res.data[0].get('report_id')}, Created At: {res.data[0].get('created_at')}")
            
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
                        eq_res = self.db.table("equipment").select("id, equipment_tag_no, location").in_("id", equipment_ids).execute()
                        if eq_res.data:
                            equipment_map = {e['id']: e for e in eq_res.data}
                    except Exception as e:
                        print(f"Error fetching equipment details: {e}")

                # Fetch User details
                user_map = {}
                if user_ids:
                    try:
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
                        status=r.get("status", "Draft"),
                        created_by=user_id
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

            # 4. Fetch Latest Review & Feedback (if any)
            feedback_items = []
            try:
                # Get latest review for this report
                review_res = self.db.table("report_review").select("review_id").eq("report_id", report_id).order("reviewed_at", desc=True).limit(1).execute()
                
                if review_res.data and len(review_res.data) > 0:
                    review_id = review_res.data[0]['review_id']
                    
                    # Get feedback items for this review
                    fb_res = self.db.table("section_feedback").select("*").eq("review_id", review_id).execute()
                    if fb_res.data:
                        feedback_items = fb_res.data
            except Exception as e:
                print(f"Error fetching feedback for report {report_id}: {e}")

            # 5. Construct Response
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
                dosh_registration_no=dosh_no,
                
                # Attach feedback
                feedback_items=feedback_items
            )
            return item

        except Exception as e:
            print(f"Error fetching report {report_id}: {e}")
            return None

    async def create_review(self, review_data: schemas.ReportReviewCreate, reviewed_by: int):
        try:
            # Normalize status
            normalized_status = review_data.status
            if review_data.status == "In Progress":
                normalized_status = "IN_PROGRESS"
            elif review_data.status == "Rejected":
                normalized_status = "NEEDS REVISION"
            elif review_data.status == "Approved":
                normalized_status = "APPROVED"

            # 1. Check for existing 'IN_PROGRESS' draft by this user
            existing_draft = self.db.table("report_review")\
                .select("review_id")\
                .eq("report_id", review_data.report_id)\
                .eq("reviewed_by", reviewed_by)\
                .eq("status", "IN_PROGRESS")\
                .order("reviewed_at", desc=True)\
                .limit(1)\
                .execute()

            if existing_draft.data:
                # UPDATE existing draft
                review_id = existing_draft.data[0]['review_id']
                print(f"🔄 FOUND existing draft review {review_id} for user {reviewed_by}")
                
                # Update status and timestamp
                self.db.table("report_review").update({
                    "status": "IN_PROGRESS", # Keep it in progress if updating draft
                    "reviewed_at": datetime.utcnow().isoformat()
                }).eq("review_id", review_id).execute()
                
                # Wipe old feedback (to handle deletions)
                del_res = self.db.table("section_feedback").delete().eq("review_id", review_id).execute()
                print(f"🗑️ DELETE section_feedback result: {del_res}")
            else:
                print(f"🆕 NO existing draft found for user {reviewed_by}. Creating new.")
                # CREATE new review record
                review_entry = {
                    "report_id": review_data.report_id,
                    "reviewed_by": reviewed_by,
                    "status": normalized_status,
                    "reviewed_at": datetime.utcnow().isoformat()
                }
                res = self.db.table("report_review").insert(review_entry).execute()
                if not res.data:
                    raise Exception("Failed to create review record")
                review_id = res.data[0]['review_id']
                print(f"✅ Created new review {review_id}")
            
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
            self.db.table("Report").update({"status": normalized_status}).eq("report_id", review_data.report_id).execute()

            # 4. Send Email Notification to Inspector
            if normalized_status in ["APPROVED", "NEEDS REVISION"]:
                try:
                    # Fetch Report Title and Creator ID
                    report_res = self.db.table("Report").select("title, created_by").eq("report_id", review_data.report_id).single().execute()
                    if report_res.data:
                        report = report_res.data
                        creator_id = report.get('created_by')
                        report_title = report.get('title')

                        # Fetch Creator Email
                        user_res = self.db.table("User").select("email, username").eq("id", creator_id).single().execute()
                        if user_res.data:
                            creator_email = user_res.data.get('email')
                            creator_name = user_res.data.get('username')
                            
                            from app.utils.email_utils import send_email
                            
                            subject = f"Report Reviewed: {report_title}"
                            status_display = "APPROVED" if normalized_status == "APPROVED" else "REJECTED (Needs Revision)"
                            action_text = "View Report"
                            
                            content = f"""
                            <p>Hello {creator_name},</p>
                            <p>Your report <strong>{report_title}</strong> has been reviewed.</p>
                            <p><strong>Status:</strong> {status_display}</p>
                            <p>Please login to the dashboard to view feedback and take necessary actions.</p>
                            <a href="http://localhost:5173/reports" class="button">{action_text}</a>
                            """
                            
                            send_email(creator_email, subject, content)
                            print(f"📧 Sent Report Review email to {creator_email}")
                except Exception as notify_e:
                    print(f"⚠️ Failed to send report email: {notify_e}")

            return True

        except Exception as e:
            print(f"Error creating review: {e}")
    async def get_recent_activities(self, user_id: Optional[int] = None) -> dict:
        """Get recent activities (report generation, reviews)"""
        try:
            # For now, let's just return recent reports as activities
            query = self.db.table("Report").select(
                "report_id, title, status, created_at, created_by"
            ).order("created_at", desc=True).limit(10)

            if user_id:
                query = query.eq("created_by", user_id)

            res = query.execute()
            
            activities = []
            if res.data:
                for r in res.data:
                    activities.append({
                        "id": r["report_id"],
                        "title": r["title"] or "Untitled Report",
                        "status": r["status"],
                        "created_at": r["created_at"],
                        "type": "report_generation"
                    })
            
            return {"activities": activities}
        except Exception as e:
            print(f"Error fetching activities: {e}")
            return {"activities": []}

    async def get_reports_summary(self, user_id: Optional[int] = None) -> dict:
        """Get summary statistics for reports"""
        try:
            # Base query
            query = self.db.table("Report").select("report_id, status, report_type, created_at, created_by")
            
            if user_id:
                query = query.eq("created_by", user_id)
                
            res = query.execute()
            
            if not res.data:
                return {
                    "totalReports": 0,
                    "byStatus": {},
                    "byType": {},
                    "byDate": {}
                }
            
            reports = res.data
            total = len(reports)
            
            by_status = {}
            by_type = {}
            by_date = {}
            
            for r in reports:
                # Status count
                status = r.get("status") or "Unknown"
                by_status[status] = by_status.get(status, 0) + 1
                
                # Type count
                rtype = r.get("report_type") or "API_510"
                by_type[rtype] = by_type.get(rtype, 0) + 1
                
                # Date count
                date_str = r.get("created_at", "")[:10] # YYYY-MM-DD
                if date_str:
                    by_date[date_str] = by_date.get(date_str, 0) + 1
            
            return {
                "totalReports": total,
                "byStatus": by_status,
                "byType": by_type,
                "byDate": by_date
            }
            
        except Exception as e:
            print(f"Error fetching summary: {e}")
            return {"totalReports": 0}

    async def get_pending_tasks(self, user_id: int, role: str) -> list:
        """Get pending tasks for user"""
        try:
            tasks = []
            
            # 1. Draft Reports (For Inspectors)
            if role in ["INSPECTOR", "ENGINEER"]:
                drafts = self.db.table("Report").select("report_id, title, created_at")\
                    .eq("created_by", user_id)\
                    .eq("status", "Draft")\
                    .execute()
                
                if drafts.data:
                    for d in drafts.data:
                        tasks.append({
                            "id": f"draft_{d['report_id']}",
                            "title": f"Complete Draft: {d['title']}",
                            "type": "draft_report",
                            "priority": "HIGH",
                            "due_date": d['created_at']
                        })

            # 2. Pending Reviews (For Admins/Engineers)
            if role in ["ADMIN", "ENGINEER"]:
                pending = self.db.table("Report").select("report_id, title, created_at")\
                    .eq("status", "Submitted")\
                    .execute()
                
                if pending.data:
                    for p in pending.data:
                        tasks.append({
                            "id": f"review_{p['report_id']}",
                            "title": f"Review Report: {p['title']}",
                            "type": "report_review",
                            "priority": "URGENT",
                            "due_date": p['created_at']
                        })

            return tasks
        except Exception as e:
            print(f"Error fetching pending tasks: {e}")
            return []
