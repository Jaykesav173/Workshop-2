from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.database.connection import get_db
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/debug")
def debug_notification_router():
    return {"message": "Notification router is working"}

@router.get("/all/{user_id}")
async def get_all_notifications(user_id: int, db: Any = Depends(get_db)):
    """
    Get all notifications for a user, aggregated from multiple sources:
    1. Pending Inspection Schedules (for Inspectors)
    2. Submitted Reports (for Admin/Engineers)
    """
    notifications = []
    
    try:
        # 1. Get User Role
        user_res = db.table("User").select("role").eq("id", user_id).execute()
        if not user_res.data:
            return []
            
        user_role = user_res.data[0]['role'].upper()
        
        # 2. Fetch Pending Schedules (For Inspectors)
        if user_role == 'INSPECTOR' or user_role == 'ADMIN': # Admin sees all for debug usually, but let's stick to logic
            try:
                # Fetch pending schedules
                schedules_res = db.table("inspectionschedule").select("*") \
                    .eq("inspector_id", user_id) \
                    .eq("status", "Pending") \
                    .execute()
                
                if schedules_res.data:
                    for s in schedules_res.data:
                         notifications.append({
                            "id": f"sched_{s.get('schedule_id')}",
                            "title": "New Schedule Assigned",
                            "message": f"Inspection for EQ-{s.get('equipment_id')} at {s.get('location') or 'Site'} is pending confirmation.",
                            "created_at": s.get('scheduled_date'), # Use scheduled date as timestamp
                            "action_link": f"/photo-upload?scheduleId={s.get('schedule_id')}",
                            "type": "schedule"
                        })
            except Exception as e:
                logger.error(f"Error fetching schedules for notifications: {e}")

            try:
                # Fetch OVERDUE schedules (Date < Today AND Status != Completed/Cancelled)
                # Note: Supabase filtering might be limited, so we might filter in Python for complex dates
                # But lt (less than) should work for dates if format matches YYYY-MM-DD
                
                today_str = datetime.now().strftime('%Y-%m-%d')
                
                overdue_res = db.table("inspectionschedule").select("*") \
                    .eq("inspector_id", user_id) \
                    .lt("scheduled_date", today_str) \
                    .neq("status", "Completed") \
                    .neq("status", "Cancelled") \
                    .execute()
                
                if overdue_res.data:
                    for s in overdue_res.data:
                         notifications.append({
                            "id": f"overdue_{s.get('schedule_id')}",
                            "title": "⚠️ Inspection Overdue",
                            "message": f"Inspection for EQ-{s.get('equipment_id')} was scheduled for {s.get('scheduled_date')} and is incomplete.",
                            "created_at": s.get('scheduled_date'), 
                            "action_link": f"/photo-upload?scheduleId={s.get('schedule_id')}",
                            "type": "overdue"
                        })
            except Exception as e:
                logger.error(f"Error fetching overdue schedules: {e}")

        # 3. Fetch Submitted Reports (For Admin/Engineer)
        if user_role == 'ADMIN' or user_role == 'ENGINEER':
            try:
                # Fetch submitted reports
                # Note: 'Report' table name is case-sensitive and might vary. 
                # Based on previous context, we'll try "Report" or "report".
                # Using "Report" as per schemas.py inference, but safely catching error
                reports_res = db.table("Report").select("*").eq("status", "Submitted").execute()
                
                if reports_res.data:
                    for r in reports_res.data:
                        notifications.append({
                            "id": f"rev_{r.get('report_id')}",
                            "title": "Report Submitted for Review",
                            "message": f"Report \"{r.get('title') or r.get('report_title') or 'Untitled'}\" is waiting for review.",
                            "created_at": r.get('created_at'),
                            "action_link": f"/review-inspection/{r.get('report_id')}",
                            "type": "review"
                        })
            except Exception as e:
                 logger.error(f"Error fetching reports for notifications: {e}")

        # Sort by date descending (newest first)
        # Handle potential missing dates or string formats
        notifications.sort(key=lambda x: str(x.get('created_at', '')), reverse=True)
        
        return notifications

    except Exception as e:
        logger.error(f"Error in get_all_notifications: {e}")
        return []
