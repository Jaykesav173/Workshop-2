from datetime import datetime
from app.database.connection import get_db

class NotificationService:
    def __init__(self):
        self.db = get_db()

    async def get_unread_notifications(self, user_id: int):
        """Fetch unread notifications for a user"""
        try:
            res = self.db.table("notifications").select("*")\
                .eq("user_id", user_id)\
                .eq("is_read", False)\
                .order("created_at", desc=True)\
                .execute()
            
            return res.data if res.data else []
        except Exception as e:
            print(f"Error fetching notifications: {e}")
            return []

    async def mark_as_read(self, notification_id: int):
        """Mark a notification as read"""
        try:
            self.db.table("notifications").update({"is_read": True})\
                .eq("id", notification_id)\
                .execute()
            return True
        except Exception as e:
            print(f"Error marking notification read: {e}")
            return False

    async def create_notification(self, user_id: int, type: str, title: str, message: str, action_link: str = None):
        """Create a new notification"""
        try:
            data = {
                "user_id": user_id,
                "type": type,
                "title": title,
                "message": message,
                "action_link": action_link,
                "created_at": str(datetime.utcnow())
            }
            self.db.table("notifications").insert(data).execute()
            return True
        except Exception as e:
            print(f"Error creating notification: {e}")
            return False
