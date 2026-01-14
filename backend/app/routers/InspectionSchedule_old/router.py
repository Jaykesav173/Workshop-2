from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from app.database.connection import get_db
from app.database import schemas
# Standard relative import since they are in the same package
from . import service

router = APIRouter(prefix="/schedules", tags=["Schedules"])

@router.post("/", response_model=schemas.ScheduleResponse)
async def create_new_assignment(payload: schemas.ScheduleCreate, db: Any = Depends(get_db)):
    data = payload.model_dump(mode='json')
    
    for field in ['equipment_type', 'safety_category', 'location']:
        data.pop(field, None)

    inspector_id = data.get('inspector_id')
    date = data.get('scheduled_date')
    start = data.get('start_time')
    end = data.get('end_time')
    
    inspector_email = data.pop('inspector_email', None)

    if inspector_id and date and start and end:
        conflict = db.table("inspectionschedule").select("*") \
            .eq("inspector_id", inspector_id) \
            .eq("scheduled_date", date) \
            .lt("start_time", end) \
            .gt("end_time", start) \
            .neq("status", "Cancelled") \
            .execute()
        
        if conflict.data:
            raise HTTPException(status_code=400, detail="Inspector is already booked for this time slot.")

    try:
        res = db.table("inspectionschedule").insert(data).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create schedule - no data returned")
            
        schedule = res.data[0]
        
        from app.utils.email_utils import send_email
        
        inspector_name = "Inspector"

        if not inspector_email:
            try:
                user_res = db.table("User").select("email, username").eq("id", inspector_id).execute()
                if user_res.data:
                    inspector_email = user_res.data[0]['email']
                    inspector_name = user_res.data[0]['username']
            except Exception as e:
                print(f"Failed to fetch inspector details: {e}")

        if inspector_email:
            try:
                from app.utils.email_templates import get_email_html
                subject = "New Inspection Schedule Assigned"
                
                details = {
                    "Equipment": str(data.get('equipment_id')),
                    "Location": data.get('location') or 'Not Specified',
                    "Date": str(date),
                    "Time": f"{start} - {end}",
                    "Priority": data.get('priority')
                }
                
                content = get_email_html(
                    title="New Inspection Schedule Assigned",
                    name=inspector_name,
                    intro="You have been assigned a new inspection schedule.",
                    details=details,
                    action_url="http://localhost:5173/inspection",
                    action_text="View Inspection Dashboard"
                )
                
                send_email(inspector_email, subject, content)
                print(f"Email sent to {inspector_email}")
            except Exception as notify_error:
                print(f"Failed to send email: {notify_error}")
        else:
            print("No inspector email found, skipping notification.")

        return schedule
        
    except Exception as e:
        print(f"Error creating schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all", response_model=List[schemas.ScheduleResponse])
def get_all_inspections(db: Any = Depends(get_db)):
    try:
        res = db.table("inspectionschedule").select("*").execute()
        return res.data if res.data else []
    except Exception as e:
        # Log the error but return empty list instead of raising 500
        import traceback
        print(f"❌ Error in get_all_inspections: {e}")
        print(traceback.format_exc())
        # Return empty list to prevent 500 errors - this allows the page to load
        return []

@router.get("/available-inspectors")
def read_inspectors(db: Any = Depends(get_db)):
    try:
        return service.get_available_inspectors(db)
    except Exception as e:
        # Log the error but return empty list instead of raising 500
        import traceback
        print(f"❌ Error in read_inspectors: {e}")
        print(traceback.format_exc())
        # Return empty list to prevent 500 errors - this allows the page to load
        return []

@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, payload: dict, db: Any = Depends(get_db)):
    try:
        allowed_keys = ['scheduled_date', 'start_time', 'end_time', 'status', 'priority', 'inspector_id', 'equipment_id']
        update_data = {k: v for k, v in payload.items() if k in allowed_keys}

        if not update_data:
             raise HTTPException(status_code=400, detail="No valid fields to update")

        res = db.table("inspectionschedule").update(update_data).eq("schedule_id", schedule_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Schedule not found")
            
        return res.data[0]
    except Exception as e:
        print(f"Error updating schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-reminder/{schedule_id}")
async def send_reminder(schedule_id: int, db: Any = Depends(get_db)):
    try:
        res = db.table("inspectionschedule").select("*").eq("schedule_id", schedule_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Schedule not found")
        
        schedule = res.data[0]
        inspector_id = schedule.get('inspector_id')
        
        from app.utils.email_utils import send_email
        
        user_res = db.table("User").select("email, username").eq("id", inspector_id).execute()
        if not user_res.data:
             raise HTTPException(status_code=404, detail="Inspector not found")
             
        inspector_email = user_res.data[0]['email']
        inspector_name = user_res.data[0]['username']
        
        from app.utils.email_templates import get_email_html
        
        status = schedule.get('status')
        date = schedule.get('scheduled_date')
        
        email_content = get_email_html(
            title=f"Reminder: Inspection {status}",
            name=inspector_name,
            intro="This is a reminder for your inspection schedule.",
            details={
                "Status": status,
                "Equipment ID": str(schedule.get('equipment_id')),
                "Date": str(date),
                "Time": f"{schedule.get('start_time')} - {schedule.get('end_time')}"
            },
            action_url="http://localhost:5173/inspection",
            action_text="Go to Dashboard"
        )
        
        send_email(inspector_email, f"Reminder: Inspection {status} - Action Required", email_content)
        print(f"Reminder email sent to {inspector_email}")
        
        return {"message": "Reminder sent successfully"}

    except Exception as e:
        print(f"Error sending reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inspector/{inspector_id}/pending")
def get_inspector_pending_schedules(inspector_id: int, db: Any = Depends(get_db)):
    """Fetch only pending schedules for a specific inspector"""
    try:
        # Use simple query for efficiency
        res = db.table("inspectionschedule").select("*") \
            .eq("inspector_id", inspector_id) \
            .eq("status", "Pending") \
            .execute()
        return res.data if res.data else []
    except Exception as e:
        print(f"Error fetching pending schedules: {e}")
        # Return empty list on error to avoid breaking UI
        return []
