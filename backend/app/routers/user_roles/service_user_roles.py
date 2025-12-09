"""
User Roles Service - Haifa
Business logic for user management and role operations
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import UserResponse

class UserRolesService:
    def __init__(self):
        self.db = get_db()
    
    async def get_all_users(self) -> list[UserResponse]:
        """Get all users"""
        try:
            res = self.db.table("User").select(
                "id, name, email, username, role, \"Account_status\", created_at"
            ).execute()
            
            if res.data:
                return [UserResponse(**user) for user in res.data]
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")
    
    async def get_user(self, user_id: int) -> UserResponse:
        """Get user by ID"""
        try:
            res = self.db.table("User").select(
                "id, name, email, username, role, \"Account_status\", created_at"
            ).eq("id", user_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            return UserResponse(**res.data[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")
    
    async def toggle_user_status(self, user_id: int) -> dict:
        """Toggle user account status"""
        try:
            res = self.db.table("User").select('"Account_status"').eq("id", user_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            current_status = res.data[0]["Account_status"]
            new_status = "INACTIVE" if current_status == "ACTIVE" else "ACTIVE"
            
            update_res = self.db.table("User").update({"Account_status": new_status}).eq("id", user_id).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to update user status")
            
            return {"success": True, "new_status": new_status}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating user status: {str(e)}")
    
    async def update_user_role(self, user_id: int, new_role: str) -> dict:
        """Update user role"""
        try:
            valid_roles = ["ADMIN", "INSPECTOR", "USER"]
            if new_role not in valid_roles:
                raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
            
            update_res = self.db.table("User").update({"role": new_role}).eq("id", user_id).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {"success": True, "message": "Role updated successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating user role: {str(e)}")

