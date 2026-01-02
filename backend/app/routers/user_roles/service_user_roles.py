"""
User Roles Service - Haifa
Business logic for user management and role operations
"""
import bcrypt
import random
from datetime import datetime
from fastapi import HTTPException
from app.database.connection import get_db
from app.utils.email_utils import send_email
from app.database.schemas import UserResponse, UserCreate

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

    async def create_user(self, user_data: UserCreate) -> dict:
        """Create a new user (admin only)"""
        try:
            # Check for duplicates
            exist = self.db.table("User").select("id").or_(
                f"username.eq.{user_data.username},email.eq.{user_data.email}"
            ).execute()

            if exist.data:
                raise HTTPException(status_code=400, detail="Username or email already exists")

            # Generate temp password if not provided
            temp_password = user_data.password or "".join(
                random.choices(
                    "abcdefghijklmnopqrstuvwxyz"
                    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                    "0123456789!@#$%^&*",
                    k=10,
                )
            )

            hashed = bcrypt.hashpw(temp_password.encode(), bcrypt.gensalt()).decode()

            user_insert = {
                "name": user_data.name,
                "email": user_data.email,
                "username": user_data.username,
                "hashed_password": hashed,
                "role": user_data.role.upper(),
                "Account_status": user_data.Account_status,
                "created_at": str(datetime.utcnow()),
                "temp_password": True
            }

            self.db.table("User").insert(user_insert).execute()

            # Send Email
            send_email(
                user_data.email,
                "Your Account Credentials",
                f"""
                <p>Hello <strong>{user_data.name}</strong>,</p>
                <p>Welcome to <strong>VISOR</strong>. Your account has been created successfully.</p>
                <p>Here are your login details:</p>
                <ul>
                    <li><strong>Username:</strong> {user_data.username}</li>
                    <li><strong>Temporary Password:</strong> {temp_password}</li>
                </ul>
                <p>Please login and change your password immediately.</p>
                <p><a href="http://localhost:5173/login" class="button">Login Needed</a></p>
                """
            )

            return {"success": True, "message": "User created & email sent"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")
    
    async def toggle_user_status(self, user_id: int) -> dict:
        """Toggle user account status"""
        try:
            res = self.db.table("User").select("name, email, \"Account_status\"").eq("id", user_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user = res.data[0]
            current_status = user["Account_status"]
            new_status = "INACTIVE" if current_status == "ACTIVE" else "ACTIVE"
            
            update_res = self.db.table("User").update({"Account_status": new_status}).eq("id", user_id).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to update user status")
            
            # Send Email
            if new_status == "INACTIVE":
                subject = "Account Deactivated"
                body = f"""
                <p>Hello <strong>{user['name']}</strong>,</p>
                <p style="color: red;">Your account has been <strong>DEACTIVATED</strong> by the administrator.</p>
                <p>You will no longer be able to log in to the VISOR system.</p>
                <p>If you believe this is an error, please contact support.</p>
                """
            else:
                subject = "Account Activated"
                body = f"""
                <p>Hello <strong>{user['name']}</strong>,</p>
                <p style="color: green;">Good news! Your account has been <strong>ACTIVATED</strong>.</p>
                <p>You can now log in and access the system.</p>
                <p><a href="http://localhost:5173/login" class="button">Login Now</a></p>
                """

            send_email(user["email"], subject, body)
            
            return {"success": True, "new_status": new_status}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating user status: {str(e)}")
    
    async def update_user_role(self, user_id: int, new_role: str) -> dict:
        """Update user role"""
        try:
            valid_roles = ["ADMIN", "INSPECTOR", "ENGINEER", "USER"] # Added ENGINEER
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

    async def update_user_profile(self, user_id: int, user_data: dict) -> dict:
        """Update user profile details"""
        try:
            # Filter out None values
            update_data = {k: v for k, v in user_data.items() if v is not None}
            
            if not update_data:
                raise HTTPException(status_code=400, detail="No data provided for update")

            res = self.db.table("User").update(update_data).eq("id", user_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            return {"success": True, "message": "Profile updated successfully", "user": res.data[0]}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

