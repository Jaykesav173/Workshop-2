"""
Authentication Service - Haifa
Business logic for authentication operations
"""
import bcrypt
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import LoginRequest, LoginResponse, UserCreate, UserResponse
from app.utils.jwt_utils import create_access_token
from datetime import datetime

class AuthService:
    def __init__(self):
        self.db = get_db()
        self.otp_store = {}
    
    async def login(self, credentials: LoginRequest) -> LoginResponse:
        """Authenticate user and return JWT token"""
        try:
            # Normalize username (strip whitespace, but keep case for now)
            username = credentials.username.strip() if credentials.username else ""
            password = credentials.password
            
            if not username or not password:
                raise HTTPException(status_code=400, detail="Username and password are required")
            
            print(f"\n🔍 LOGIN ATTEMPT:")
            print(f"   Username: '{username}' (length: {len(username)})")
            
            # Use simple table name "User" (Supabase adds public. automatically)
            # Note: If RLS is enabled, make sure service role key has bypass permissions
            res = self.db.table("User").select(
                "id, username, hashed_password, role, \"Account_status\", temp_password, email"
            ).eq("username", username).execute()
            
            if not res.data:
                # Try case-insensitive search
                all_users = self.db.table("User").select("id, username").execute()
                if all_users.data:
                    for user in all_users.data:
                        if user.get('username', '').lower() == username.lower():
                            res = self.db.table("User").select(
                                "id, username, hashed_password, role, \"Account_status\", temp_password, email"
                            ).eq("id", user.get('id')).execute()
                            break
            
            if not res.data:
                raise HTTPException(status_code=401, detail="Invalid username or password")
            
            user = res.data[0]
            
            if user["Account_status"] != "ACTIVE":
                raise HTTPException(status_code=403, detail="Account inactive. Please contact admin.")
            
            # Check password
            stored_hash = user["hashed_password"]
            if isinstance(stored_hash, bytes):
                stored_hash = stored_hash.decode("utf-8")
            stored_hash = stored_hash.strip() if stored_hash else ""
            
            if not stored_hash or not stored_hash.startswith(('$2a$', '$2b$', '$2y$')):
                raise HTTPException(status_code=500, detail="Invalid password hash format. Please reset password.")
            
            try:
                if not bcrypt.checkpw(credentials.password.encode("utf-8"), stored_hash.encode("utf-8")):
                    raise HTTPException(status_code=401, detail="Invalid username or password")
            except ValueError:
                raise HTTPException(status_code=500, detail="Password verification error.")
            
            # Create JWT token
            token = create_access_token(data={"sub": user["username"], "id": user["id"], "role": user["role"]})
            
            return LoginResponse(
                success=True,
                message="Login successful",
                access_token=token,
                user={
                    "id": user["id"],
                    "username": user["username"],
                    "role": user["role"],
                    "email": user.get("email"),
                    "isFirstLogin": user.get("temp_password", False)
                }
            )
            
            # Fetch notifications (e.g. Pending schedules for inspectors)
            notifications = []
            if user["role"] in ["INSPECTOR", "USER"]: # Assuming USER can also be an inspector
                 # Fetch pending schedules
                 schedules = self.db.table("inspectionschedule").select("*").eq("inspector_id", user["id"]).eq("status", "Pending").execute()
                 if schedules.data:
                     print(f"FOUND {len(schedules.data)} PENDING SCHEDULES FOR USER {user['id']}")
                     for s in schedules.data:
                         notifications.append({
                             "type": "schedule",
                             "message": f"New Inspection Schedule: Equipment {s.get('equipment_id')} at {s.get('location', 'Unknown Location')}",
                             "id": s.get("schedule_id"),
                             "date": s.get("scheduled_date")
                         })
                 else:
                     print(f"NO PENDING SCHEDULES FOR USER {user['id']}")
                         
            # Fetch rejected report notifications for everyone (or specifically report creators)
            # Assuming 'Report' table checks 'created_by'
            # OPTIMIZED: Select only necessary columns to avoid fetching huge content/images
            reports = self.db.table("Report").select(
                "report_id, title, status, created_at, updated_at"
            ).eq("created_by", user["id"]).eq("status", "Rejected").execute()
            
            if reports.data:
                for r in reports.data:
                    notifications.append({
                        "type": "report_rejected",
                        "message": f"Report Rejected: {r.get('title', 'Untitled Report')}",
                        "id": r.get("report_id"),
                        "date": str(r.get("updated_at") or r.get("created_at"))
                    })
            
            print(f"RETURNING {len(notifications)} NOTIFICATIONS IN LOGIN RESPONSE")
            response.notifications = notifications
            return response
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error during login: {str(e)}")
    
    async def register(self, user_data: UserCreate) -> UserResponse:
        """Register a new user"""
        try:
            # Check for duplicates - use simple table name "User"
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
                user = res.data[0]
                user.pop("hashed_password", None)
                return UserResponse(**user)
            else:
                raise HTTPException(status_code=400, detail="Failed to register user")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error during registration: {str(e)}")

    async def verify_security_questions(self, data):
        """Verify security questions and send OTP"""
        try:
            user_res = self.db.table("User").select(
                "id, school_name, mother_name"
            ).eq("email", data.email).execute()

            if not user_res.data:
                raise HTTPException(status_code=404, detail="Email not found")

            user = user_res.data[0]
            stored_school = user.get("school_name", "") or ""
            stored_mother = user.get("mother_name", "") or ""
            
            if (
                stored_school.strip().lower() != data.school_name.strip().lower() or
                stored_mother.strip().lower() != data.mother_name.strip().lower()
            ):
                raise HTTPException(status_code=400, detail="Security answers do not match")

            import random
            from app.utils.email_utils import send_email
            from datetime import timedelta
            
            from app.utils.email_templates import get_email_html

            otp = str(random.randint(100000, 999999))
            self.otp_store[data.email] = {
                "otp": otp,
                "expires_at": datetime.utcnow() + timedelta(minutes=5)
            }
            
            email_content = get_email_html(
                title="Password Recovery OTP",
                name="User",
                intro="Here is your One-Time Password (OTP) for password recovery.",
                details={
                    "OTP Code": f'<span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">{otp}</span>',
                    "Expires In": "5 minutes"
                },
                action_text="Use this code in the app"
            )

            send_email(
                data.email,
                "Password Recovery OTP",
                email_content
            )
            
            return {"success": True, "message": "Security answers verified and OTP sent"}
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error in verify_security_questions: {e}")
            raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    async def send_recovery_email(self, email: str) -> dict:
        """Send recovery OTP to email"""
        try:
            user = self.db.table("User").select("email").eq("email", email).execute()
            if not user.data:
                raise HTTPException(status_code=404, detail="Email not found")

            import random
            from app.utils.email_utils import send_email
            from datetime import timedelta

            from app.utils.email_templates import get_email_html

            otp = str(random.randint(100000, 999999))
            self.otp_store[email] = {
                "otp": otp,
                "expires_at": datetime.utcnow() + timedelta(minutes=5)
            }
            
            email_content = get_email_html(
                title="Password Recovery OTP",
                name="User",
                intro="Here is your One-Time Password (OTP) for password recovery.",
                details={
                    "OTP Code": f'<span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">{otp}</span>',
                    "Expires In": "5 minutes"
                },
                action_text="Use this code in the app"
            )

            send_email(
                email,
                "Password Recovery OTP",
                email_content
            )

            return {"success": True, "message": "OTP Sent"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    async def verify_otp(self, email: str, otp: str) -> dict:
        """Verify OTP"""
        try:
            record = self.otp_store.get(email)
            
            if not record:
                raise HTTPException(status_code=404, detail="OTP not found or expired")
            
            if datetime.utcnow() > record["expires_at"]:
                self.otp_store.pop(email)
                raise HTTPException(status_code=400, detail="OTP expired")
            
            if otp != record["otp"]:
                raise HTTPException(status_code=400, detail="Invalid OTP")
            
            self.otp_store.pop(email)
            return {"success": True, "message": "OTP Verified"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    async def reset_password_first_login(self, username: str, current_pass: str, new_pass: str) -> dict:
        """Reset password on first login"""
        try:
            user = self.db.table("User").select("id,hashed_password").eq("username", username).execute()
            if not user.data:
                raise HTTPException(status_code=404, detail="User not found")
            
            current_hash = user.data[0]["hashed_password"]
            
            if not bcrypt.checkpw(current_pass.encode("utf-8"), current_hash.encode("utf-8")):
                raise HTTPException(status_code=401, detail="Current password incorrect")
            
            new_hash = bcrypt.hashpw(new_pass.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            
            self.db.table("User").update({
                "hashed_password": new_hash,
                "temp_password": False
            }).eq("username", username).execute()
            
            return {"success": True, "message": "Password updated"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

    async def reset_password_forgot(self, email: str, new_pass: str) -> dict:
        """Reset password after forgot password flow"""
        try:
            user = self.db.table("User").select("id").eq("email", email).execute()
            if not user.data:
                raise HTTPException(status_code=404, detail="Email not found")
            
            new_hash = bcrypt.hashpw(new_pass.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            
            self.db.table("User").update({
                "hashed_password": new_hash,
                "temp_password": False
            }).eq("email", email).execute()
            
            return {"success": True, "message": "Password reset successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
