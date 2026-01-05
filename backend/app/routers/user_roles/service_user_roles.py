"""
User Roles Service - Haifa
Business logic for user management and role operations
"""
import bcrypt
from datetime import datetime
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import UserResponse, UserCreate, UserUpdate

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
                # Handle potential None values for role, email, Account_status, created_at
                users = []
                for user in res.data:
                    # Ensure role is not None
                    if user.get('role') is None:
                        user['role'] = 'USER'
                    # Ensure Account_status is not None
                    if user.get('Account_status') is None:
                        user['Account_status'] = 'ACTIVE'
                    # Handle email - if None or empty, set to None (optional field)
                    if not user.get('email'):
                        user['email'] = None
                    # Handle created_at - if None, set to None (optional field)
                    if user.get('created_at') is None:
                        user['created_at'] = None
                    users.append(UserResponse(**user))
                return users
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")
    
    async def create_user(self, user_data: UserCreate) -> dict:
        """Create a new user"""
        try:
            # Check for duplicates
            existing = self.db.table("User").select("id").or_(
                f"username.eq.{user_data.username},email.eq.{user_data.email}"
            ).execute()
            
            if existing.data:
                raise HTTPException(status_code=400, detail="Username or email already exists")
            
            # Hash password
            hashed_pw = bcrypt.hashpw(user_data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            
            new_user = {
                "name": user_data.name,
                "email": user_data.email,
                "username": user_data.username,
                "hashed_password": hashed_pw,
                "role": user_data.role,
                "Account_status": user_data.Account_status,
                "created_at": str(datetime.utcnow())
            }
            
            res = self.db.table("User").insert(new_user).execute()
            
            if res.data:
                return {"success": True, "message": "User created successfully"}
            else:
                raise HTTPException(status_code=400, detail="Failed to register user")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error during user creation: {str(e)}")
    
    async def get_user(self, user_id: int) -> UserResponse:
        """Get user by ID"""
        try:
            res = self.db.table("User").select(
                "id, name, email, username, role, \"Account_status\", created_at"
            ).eq("id", user_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user = res.data[0]
            # Handle null values and provide defaults
            if user.get('role') is None:
                user['role'] = 'USER'
            if user.get('Account_status') is None:
                user['Account_status'] = 'ACTIVE'
            # Handle email - if None or empty, set to None (optional field)
            if not user.get('email'):
                user['email'] = None
            # Handle created_at - if None, set to None (optional field)
            if user.get('created_at') is None:
                user['created_at'] = None
            
            return UserResponse(**user)
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
    
    async def update_user(self, user_id: int, user_data: UserUpdate) -> dict:
        """Update user information"""
        try:
            # Check if user exists
            existing = self.db.table("User").select("id").eq("id", user_id).execute()
            if not existing.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Build update data (only include fields that are provided)
            update_data = {}
            
            if user_data.name is not None:
                update_data["name"] = user_data.name
            if user_data.email is not None:
                update_data["email"] = user_data.email
            if user_data.username is not None:
                # Check if username is already taken by another user
                username_check = self.db.table("User").select("id").eq("username", user_data.username).neq("id", user_id).execute()
                if username_check.data:
                    raise HTTPException(status_code=400, detail="Username already exists")
                update_data["username"] = user_data.username
            if user_data.password is not None and user_data.password:
                # Hash new password
                hashed_pw = bcrypt.hashpw(user_data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                update_data["hashed_password"] = hashed_pw
            if user_data.role is not None:
                valid_roles = ["ADMIN", "INSPECTOR", "USER", "ENGINEER"]
                if user_data.role.upper() not in valid_roles:
                    raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
                update_data["role"] = user_data.role.upper()
            if user_data.Account_status is not None:
                update_data["Account_status"] = user_data.Account_status
            
            if not update_data:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            # Update user
            update_res = self.db.table("User").update(update_data).eq("id", user_id).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to update user")
            
            return {"success": True, "message": "User updated successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")
    
    async def update_user_role(self, user_id: int, new_role: str) -> dict:
        """Update user role"""
        try:
            valid_roles = ["ADMIN", "INSPECTOR", "USER", "ENGINEER"]
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

