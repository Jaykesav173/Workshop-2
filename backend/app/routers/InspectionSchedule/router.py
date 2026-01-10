from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from app.database.connection import get_db
from app.database import schemas
# Import service using importlib to avoid null byte issues
import importlib.util
service_spec = importlib.util.spec_from_file_location("schedule_service", "app/routers/InspectionSchedule/service.py")
service_module = importlib.util.module_from_spec(service_spec)
service_spec.loader.exec_module(service_module)
service = service_module

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
                subject = "New Inspection Schedule Assigned"
                content = f"""
                <p>Hello {inspector_name},</p>
                <p>You have been assigned a new inspection schedule.</p>
                <ul>
                    <li><strong>Site/Equipment:</strong> {data.get('site_id')} / {data.get('equipment_id')}</li>
                    <li><strong>Date:</strong> {date}</li>
                    <li><strong>Time:</strong> {start} - {end}</li>
                    <li><strong>Priority:</strong> {data.get('priority')}</li>
                </ul>
                <p>Please login to your dashboard to view full details.</p>
                <a href="http://localhost:5173/inspection" class="button">View Inspection</a>
                """
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
        return res.data
    except Exception as e:
        print(f"Error fetching schedules: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available-inspectors")
def read_inspectors(db: Any = Depends(get_db)):
    return service.get_available_inspectors(db)

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
        
        status = schedule.get('status')
        date = schedule.get('scheduled_date')
        
        subject = f"Reminder: Inspection {status} - Action Required"
        content = f"""
        <p>Hello {inspector_name},</p>
        <p>This is a reminder for your inspection schedule.</p>
        <ul>
            <li><strong>Status:</strong> {status}</li>
            <li><strong>Equipment ID:</strong> {schedule.get('equipment_id')}</li>
            <li><strong>Date:</strong> {date}</li>
            <li><strong>Time:</strong> {schedule.get('start_time')} - {schedule.get('end_time')}</li>
        </ul>
        <p>Please login to your dashboard to view details and take action.</p>
        <a href="http://localhost:5173/inspection" class="button">Go to Dashboard</a>
        """
        
        send_email(inspector_email, subject, content)
        print(f"Reminder email sent to {inspector_email}")
        
        return {"message": "Reminder sent successfully"}

    except Exception as e:
        print(f"Error sending reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))
