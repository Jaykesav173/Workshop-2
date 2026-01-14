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
            
            # Generate temp password if not provided
            import random
            temp_password = user_data.password
            is_temp = False
            
            if not temp_password:
                is_temp = True
                temp_password = "".join(
                    random.choices(
                        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*",
                        k=10,
                    )
                )

            # Hash password
            hashed_pw = bcrypt.hashpw(temp_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            
            new_user = {
                "name": user_data.name,
                "email": user_data.email,
                "username": user_data.username,
                "hashed_password": hashed_pw,
                "role": user_data.role,
                "Account_status": user_data.Account_status,
                "created_at": str(datetime.utcnow()),
                "temp_password": is_temp
            }
            
            res = self.db.table("User").insert(new_user).execute()
            
            if res.data:
                # Send email
                from app.utils.email_utils import send_email
                from app.utils.email_templates import get_email_html
                
                email_content = get_email_html(
                    title="Welcome to VISOR System",
                    name=user_data.name,
                    intro="Your account has been successfully created. Here are your credentials:",
                    details={
                        "Username": user_data.username,
                        "Temporary Password": temp_password,
                        "Role": user_data.role
                    },
                    action_url="http://localhost:5173/login",
                    action_text="Login to Dashboard"
                )
                
                send_email(user_data.email, "Your Account Credentials", email_content)

                return {"success": True, "message": "User created successfully & email sent"}
            else:
                raise HTTPException(status_code=400, detail="Failed to register user")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error during user creation: {str(e)}")
    
    async def get_user(self, user_id: int) -> UserResponse:
        """Get user by ID"""
        try:
            res = self.db.table("User").select("*").eq("id", user_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user = res.data[0]
            # Handle null values and provide defaults
            if user.get('role') is None:
                user['role'] = 'USER'
            if user.get('Account_status') is None:
                user['Account_status'] = 'ACTIVE'
            
            # Map optional fields
            # Note: UserResponse schema now includes phone_number, ic_number, etc.
            # If they are in the DB response (select "*"), they will be passed to UserResponse(**user)
            # Pydantic will ignore extra fields if configured, but here we want to ensure schema fields are present.
            
            return UserResponse(**user)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")
    
    async def toggle_user_status(self, user_id: int) -> dict:
        """Toggle user account status"""
        try:
            res = self.db.table("User").select('"Account_status", name, email').eq("id", user_id).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            user = res.data[0]
            current_status = user["Account_status"]
            new_status = "INACTIVE" if current_status == "ACTIVE" else "ACTIVE"
            
            update_res = self.db.table("User").update({"Account_status": new_status}).eq("id", user_id).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to update user status")
            
            # Send Email
            from app.utils.email_utils import send_email
            from app.utils.email_templates import get_email_html
            
            status_color = "#10B981" if new_status == "ACTIVE" else "#EF4444"
            intro_text = (
                f"Your account status has been updated to {new_status}. You can now login."
                if new_status == "ACTIVE"
                else f"Your account has been DEACTIVATED. You can no longer login."
            )
            
            email_content = get_email_html(
                title=f"Account Status: {new_status}",
                name=user.get('name', 'User'),
                intro=intro_text,
                details={
                    "New Status": f'<span style="color: {status_color}; font-weight: bold;">{new_status}</span>',
                },
                action_url="http://localhost:5173/login" if new_status == "ACTIVE" else None,
                action_text="Login Now"
            )

            if user.get("email"):
                send_email(user["email"], f"Account Status: {new_status}", email_content)

            return {"success": True, "new_status": new_status, "message": f"Status updated to {new_status} and email sent"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating user status: {str(e)}")
    
    async def update_user(self, user_id: int, user_data: UserUpdate) -> dict:
        """Update user information (Unified Profile Update)"""
        try:
            # Check if user exists
            existing = self.db.table("User").select("id, username, email, hashed_password").eq("id", user_id).execute()
            if not existing.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            current_user = existing.data[0]
            
            # Build update data
            update_data = {}
            
            # --- Field Mapping ---
            fields_to_update = {
                "name": user_data.name,
                "email": user_data.email,
                "username": user_data.username,
                "role": user_data.role,
                "Account_status": user_data.Account_status,
                "phone_number": user_data.phone_number,
                "ic_number": user_data.ic_number,
                "date_of_birth": user_data.date_of_birth,
                "school_name": user_data.school_name,
                "mother_name": user_data.mother_name,
            }

            for field, value in fields_to_update.items():
                if value is not None:
                     # Specific Validations
                    if field == "email" and value != current_user["email"]:
                        email_check = self.db.table("User").select("id").eq("email", value).neq("id", user_id).execute()
                        if email_check.data:
                             raise HTTPException(status_code=400, detail="Email already exists")
                    
                    if field == "username" and value != current_user["username"]:
                        username_check = self.db.table("User").select("id").eq("username", value).neq("id", user_id).execute()
                        if username_check.data:
                            raise HTTPException(status_code=400, detail="Username already exists")
                    
                    if field == "role":
                         valid_roles = ["ADMIN", "INSPECTOR", "USER", "ENGINEER"]
                         if value.upper() not in valid_roles:
                             raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
                         value = value.upper()
                         
                    update_data[field] = value
            
            # --- Password Change Logic ---
            if user_data.new_password:
                if not user_data.current_password:
                     # Check if we are administrative override (optional: if role is admin?) 
                     # For now, strict as per user request
                     raise HTTPException(status_code=400, detail="Current password required to change password")
                
                # Check current password
                current_hash = current_user["hashed_password"]
                if not bcrypt.checkpw(user_data.current_password.encode("utf-8"), current_hash.encode("utf-8")):
                    raise HTTPException(status_code=401, detail="Current password incorrect")
                
                # Hash new password
                hashed_pw = bcrypt.hashpw(user_data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                update_data["hashed_password"] = hashed_pw
                update_data["temp_password"] = False
            
            # Fallback legacy password Update (if just 'password' is sent without current_password check - for Admin resets potentially)
            # You might want to restrict this to Admins only in future
            elif user_data.password:
                 hashed_pw = bcrypt.hashpw(user_data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                 update_data["hashed_password"] = hashed_pw
            
            if not update_data:
                return {"success": True, "message": "No changes made"}
            
            # Update user
            update_res = self.db.table("User").update(update_data).eq("id", user_id).execute()
            
            if not update_res.data:
                raise HTTPException(status_code=500, detail="Failed to update user")
            
            return {"success": True, "message": "User updated successfully", "user": update_res.data[0]}
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

    async def complete_profile(self, data) -> dict:
        """Complete user profile"""
        try:
            # Validate date format
            try:
                datetime.strptime(data.date_of_birth, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format (YYYY-MM-DD)")

            # Find user
            user_res = self.db.table("User").select("id").eq("username", data.username).execute()
            if not user_res.data:
                raise HTTPException(status_code=404, detail="User not found")

            user_id = user_res.data[0]["id"]

            # Update profile
            self.db.table("User").update({
                "ic_number": data.ic_number,
                "date_of_birth": data.date_of_birth,
                "phone_number": data.phone_number,
                "school_name": data.school_name,
                "mother_name": data.mother_name,
            }).eq("id", user_id).execute()

            return {"success": True, "message": "Profile completed successfully", "user_id": user_id}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error completing profile: {str(e)}")

