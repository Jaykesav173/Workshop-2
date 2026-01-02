from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from app.database.connection import get_db
from .service_notifications import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])
notification_service = NotificationService()

@router.get("/unread/{user_id}")
async def get_unread_notifications(user_id: int):
    """
    Get unread notifications for a specific user
    """
    return await notification_service.get_unread_notifications(user_id)

@router.put("/{notification_id}/read")
async def mark_notification_as_read(notification_id: int):
    """
    Mark a notification as read
    """
    success = await notification_service.mark_as_read(notification_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")
    return {"status": "success"}
