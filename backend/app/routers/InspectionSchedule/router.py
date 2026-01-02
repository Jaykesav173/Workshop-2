from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from app.database.connection import get_db
from app.database import schemas
from . import service

router = APIRouter(prefix="/schedules", tags=["Schedules"])

@router.post("/", response_model=schemas.ScheduleResponse)
def create_new_assignment(payload: schemas.ScheduleCreate, db: Any = Depends(get_db)):
    # Convert Pydantic model to dict (using mode='json' to handle dates/times)
    data = payload.model_dump(mode='json')
    
    # Remove fields that are not in the database table 'inspectionschedule'
    for field in ['equipment_type', 'safety_category', 'location']:
        data.pop(field, None)

    # --- Conflict Validation ---
    inspector_id = data.get('inspector_id')
    date = data.get('scheduled_date')
    start = data.get('start_time')
    end = data.get('end_time')

    if inspector_id and date and start and end:
        # Check for overlaps: 
        # (StartA < EndB) and (EndA > StartB)
        conflict = db.table("inspectionschedule").select("*") \
            .eq("inspector_id", inspector_id) \
            .eq("scheduled_date", date) \
            .lt("start_time", end) \
            .gt("end_time", start) \
            .neq("status", "Cancelled") \
            .execute()
        
        if conflict.data:
            raise HTTPException(status_code=400, detail="Inspector is already booked for this time slot.")

    # Supabase Insert
    try:
        # Using 'inspectionschedule' as seen in user's schema
        res = db.table("inspectionschedule").insert(data).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create schedule - no data returned")
            
        return res.data[0]
        
    except Exception as e:
        print(f"Error creating schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all", response_model=List[schemas.ScheduleResponse])
def get_all_inspections(db: Any = Depends(get_db)):
    # Fetch all schedules
    try:
        # Use 'inspectionschedule' table
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
    """
    Updates a schedule. 
    Can be used for rescheduling (passing new date/time) or cancelling (passing status='Cancelled').
    """
    try:
        # Filter out keys that might not exist or shouldn't be updated directly if passed
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