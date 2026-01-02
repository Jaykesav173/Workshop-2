"""
Authentication Service - Haifa
Business logic for authentication operations
"""
import bcrypt
from fastapi import HTTPException
from app.database.connection import get_db
from app.utils.jwt_utils import create_access_token
import random
from datetime import datetime, timedelta
from app.utils.email_utils import send_email
from app.database.schemas import (
    LoginRequest, LoginResponse, UserCreate, UserResponse,
    VerifySecurityQuestionsRequest, OTPVerifyRequest, EmailRequest,
    ResetPasswordRequest, ResetPasswordForgotRequest, CompleteProfileRequest
)

# Simple in-memory store for OTPs (same as legacy)
otp_store = {}

class AuthService:
    def __init__(self):
        self.db = get_db()
    
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
            res = self.db.table("User").select(
                "id, username, hashed_password, role, \"Account_status\", email, temp_password"
            ).eq("username", username).execute()
            
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
                raise HTTPException(status_code=500, detail="Invalid password hash format in database.")
            
            try:
                password_bytes = credentials.password.encode("utf-8")
                hash_bytes = stored_hash.encode("utf-8")
                password_match = bcrypt.checkpw(password_bytes, hash_bytes)
                
                if not password_match:
                    raise HTTPException(status_code=401, detail="Invalid username or password")
            except ValueError as e:
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
                    "email": user["email"],
                    "isFirstLogin": user.get("temp_password", False)
                }
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error during login: {str(e)}")
    
    async def register(self, user_data: UserCreate) -> UserResponse:
        """Register a new user"""
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
                "created_at": str(datetime.utcnow()),
                "temp_password": True # Mark as needing update implicitly if needed
            }
            
            res = self.db.table("User").insert(new_user).execute()
            
            if res.data:
                user = res.data[0]
                
                # Send Welcome Email
                send_email(
                    user["email"],
                    "Welcome to VISOR",
                    f"""
                    <p>Hello <strong>{user['name']}</strong>,</p>
                    <p>Welcome to <strong>VISOR</strong>. Your account has been registered successfully.</p>
                    <p><strong>Username:</strong> {user['username']}</p>
                    <p>Please contact your admin if you need any assistance.</p>
                    """
                )

                user.pop("hashed_password", None)
                return UserResponse(**user)
            else:
                raise HTTPException(status_code=400, detail="Failed to register user")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Server error during registration: {str(e)}")

    async def verify_security_questions(self, data: VerifySecurityQuestionsRequest) -> dict:
        try:
            print(f"\n🔍 VERIFY SECURITY QUESTIONS:")
            print(f"   Email: {data.email}")
            print(f"   Input School: {data.school_name}")
            print(f"   Input Mother: {data.mother_name}")

            # Step 1: Check if email exists
            user_res = self.db.table("User").select(
                "id, school_name, mother_name"
            ).eq("email", data.email).execute()

            if not user_res.data:
                print("❌ Email not found in DB")
                raise HTTPException(status_code=404, detail="Email not found")

            user = user_res.data[0]
            print(f"   DB School: {user.get('school_name')}")
            print(f"   DB Mother: {user.get('mother_name')}")

            # Step 2: Verify security question answers (case-insensitive)
            # Handle possible None values in DB
            db_school = user.get("school_name", "") or ""
            db_mother = user.get("mother_name", "") or ""
            
            if (
                db_school.strip().lower() != data.school_name.strip().lower() or
                db_mother.strip().lower() != data.mother_name.strip().lower()
            ):
                print("❌ Security answers mismatch")
                raise HTTPException(status_code=400, detail="Security answers do not match")

            # Step 3: If verified, generate and store OTP
            otp = str(random.randint(100000, 999999))
            otp_store[data.email] = {
                "otp": otp,
                "expires_at": datetime.utcnow() + timedelta(minutes=5)
            }
            print(f"   Generated OTP: {otp}")

            # Send OTP via email
            print("   Sending email...")
            try:
                sent = send_email(
                    data.email,
                    "Password Recovery OTP",
                    f"""
                    <p>You requested a password reset for your VISOR account.</p>
                    <p>Please use the following One-Time Password (OTP) to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; background: #f0f7ff; padding: 10px 30px; border-radius: 8px;">{otp}</span>
                    </div>
                    <p>This code will expire in 5 minutes.</p>
                    """
                )
                print(f"   Email send result: {sent}")
                
                if not sent:
                    print("⚠️ Failed to send OTP email - send_email returned False")
                    # Note: We might want to raise an error here if strict email is required
            except Exception as email_err:
                print(f"❌ Exception sending email: {str(email_err)}")
                # Re-raise or handle gracefully? For now log it.
                raise HTTPException(status_code=500, detail=f"Failed to send email: {str(email_err)}")

            return {"success": True, "message": "Security answers verified and OTP sent"}
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ UNEXPECTED ERROR in verify_security_questions: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error verifying security questions: {str(e)}")

    async def send_recovery_email(self, req: EmailRequest) -> dict:
        try:
            user = self.db.table("User").select("email").eq("email", req.email).execute()
            if not user.data:
                raise HTTPException(status_code=404, detail="Email not found")

            otp = str(random.randint(100000, 999999))
            otp_store[req.email] = {
                "otp": otp,
                "expires_at": datetime.utcnow() + timedelta(minutes=5)
            }

            send_email(
                req.email,
                "Password Recovery OTP",
                 f"""
                <p>You requested a password reset for your VISOR account.</p>
                <p>Please use the following One-Time Password (OTP) to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; background: #f0f7ff; padding: 10px 30px; border-radius: 8px;">{otp}</span>
                </div>
                <p>This code will expire in 5 minutes.</p>
                """
            )
            return {"success": True, "message": "OTP Sent"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error sending recovery email: {str(e)}")

    async def verify_otp(self, req: OTPVerifyRequest) -> dict:
        record = otp_store.get(req.email)
        if not record:
            raise HTTPException(status_code=404, detail="OTP not found")

        if datetime.utcnow() > record["expires_at"]:
            otp_store.pop(req.email)
            raise HTTPException(status_code=400, detail="OTP expired")

        if req.otp != record["otp"]:
            raise HTTPException(status_code=400, detail="Invalid OTP")

        otp_store.pop(req.email)
        return {"success": True}

    async def reset_password_forgot(self, req: ResetPasswordForgotRequest) -> dict:
        try:
            user = self.db.table("User").select("id, email, name").eq("email", req.email).execute()
            if not user.data:
                raise HTTPException(status_code=404, detail="Email not found")

            new_hash = bcrypt.hashpw(req.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            self.db.table("User").update({
                "hashed_password": new_hash,
                "temp_password": False
            }).eq("email", req.email).execute()
            
            # Send confirmation
            send_email(
                req.email, 
                "Password Reset Successful", 
                """
                <p>Your password has been <strong>successfully reset</strong>.</p>
                <p>You can now log in with your new password.</p>
                <p><a href="http://localhost:5173/login" class="button">Login to VISOR</a></p>
                """
            )

            return {"success": True, "message": "Password reset"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error resetting password: {str(e)}")

    async def reset_password_first_login(self, req: ResetPasswordRequest) -> dict:
        try:
            user = self.db.table("User").select("id,hashed_password").eq("username", req.username).execute()
            if not user.data:
                raise HTTPException(status_code=404, detail="User not found")

            current_hash = user.data[0]["hashed_password"]
            if not bcrypt.checkpw(req.current_password.encode("utf-8"), current_hash.encode("utf-8")):
                raise HTTPException(status_code=401, detail="Current password incorrect")

            new_hash = bcrypt.hashpw(req.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            self.db.table("User").update({
                "hashed_password": new_hash,
                "temp_password": False
            }).eq("username", req.username).execute()

            return {"success": True, "message": "Password updated"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating password: {str(e)}")

    async def complete_profile(self, data: CompleteProfileRequest) -> dict:
        try:
             # Validate date format (simple check)
            try:
                datetime.strptime(data.date_of_birth, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format (YYYY-MM-DD)")

            user_res = self.db.table("User").select("id").eq("username", data.username).execute()
            if not user_res.data:
                raise HTTPException(status_code=404, detail="User not found")

            user_id = user_res.data[0]["id"]

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

