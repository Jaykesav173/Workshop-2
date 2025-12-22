# backend/main.py

import os
import bcrypt
import random
import logging
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv



from database import supabase   # Supabase client

# -------------------------------
# SETUP
# -------------------------------
load_dotenv()

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# -------------------------------
# CORS
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# UTILITIES
# -------------------------------
otp_store = {}

def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"✅ Email sent to {to_email}")

    except Exception as e:
        logger.error(f"❌ Email error: {str(e)}")
        raise HTTPException(500, "Email service error")

# -------------------------------
# MODELS
# -------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str
    requested_role: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str | None = None
    role: str
    Account_status: str = "ACTIVE"

class EmailRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    username: str
    current_password: str
    new_password: str

class ResetPasswordForgotRequest(BaseModel):
    email: EmailStr
    new_password: str

class CompleteProfileRequest(BaseModel):
    username: str
    ic_number: str
    date_of_birth: str
    phone_number: str
    school_name: str
    mother_name: str

class VerifySecurityQuestionsRequest(BaseModel):
    email: EmailStr
    school_name: str
    mother_name: str

class DashboardSummary(BaseModel):
    success: bool
    totalInspections: int
    photosUploaded: int
    reportsGenerated: int

# Unified flexible update model
class UserFlexibleUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    username: str | None = None
    phone_number: str | None = None
    ic_number: str | None = None
    date_of_birth: str | None = None
    school_name: str | None = None
    mother_name: str | None = None
    role: str | None = None
    current_password: str | None = None
    new_password: str | None = None

# -------------------------------
# LOGIN
# -------------------------------
@app.post("/api/login")
def login(data: LoginRequest):
    res = supabase.table("User").select(
        "id,username,hashed_password,role,"
        "\"Account_status\",email,temp_password"
    ).eq("username", data.username).execute()

    if not res.data:
        raise HTTPException(401, "Invalid username or password")

    user = res.data[0]

    if user["Account_status"] != "ACTIVE":
        raise HTTPException(403, "Account inactive")

    if not bcrypt.checkpw(data.password.encode(), user["hashed_password"].encode()):
        raise HTTPException(401, "Invalid username or password")

    if user["role"].upper() != data.requested_role.upper():
        raise HTTPException(403, "You cannot log in as this role")

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "email": user["email"],
            "isFirstLogin": user.get("temp_password", False)
        }
    }

# -------------------------------
# USERS LIST
# -------------------------------
@app.get("/api/users")
def get_users():
    res = supabase.table("User").select(
        "id,name,email,username,role,"
        "\"Account_status\",created_at,temp_password"
    ).execute()

    return {"success": True, "users": res.data}

# -------------------------------
# GET SINGLE USER (FULL PROFILE)
# -------------------------------
@app.get("/api/users/{user_id}")
def get_user(user_id: int = Path(...)):
    res = supabase.table("User").select("*").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(404, "User not found")
    return {"success": True, "user": res.data[0]}

# -------------------------------
# CREATE USER
# -------------------------------
@app.post("/api/users")
def add_user(data: UserCreate):

    exist = supabase.table("User").select("id").or_(
        f"username.eq.{data.username},email.eq.{data.email}"
    ).execute()

    if exist.data:
        raise HTTPException(400, "Username or email already exists")

    temp_password = data.password or "".join(
        random.choices(
            "abcdefghijklmnopqrstuvwxyz"
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "0123456789!@#$%^&*",
            k=10,
        )
    )

    hashed = bcrypt.hashpw(temp_password.encode(), bcrypt.gensalt()).decode()

    supabase.table("User").insert({
        "name": data.name,
        "email": data.email,
        "username": data.username,
        "hashed_password": hashed,
        "role": data.role.upper(),
        "Account_status": data.Account_status,
        "created_at": datetime.utcnow().isoformat(),
        "temp_password": True
    }).execute()

    send_email(
        data.email,
        "Your Account Credentials",
        f"""
Hello {data.name},

Your account has been created.

Username: {data.username}
Temporary Password: {temp_password}

Please login and reset your password immediately.
"""
    )

    return {"success": True, "message": "User created & email sent"}

# -------------------------------
# TOGGLE USER STATUS + EMAIL NOTIFICATION
# -------------------------------
@app.patch("/api/users/{user_id}/status")
def toggle_status(user_id: int):

    res = supabase.table("User") \
        .select("name,email,\"Account_status\"") \
        .eq("id", user_id).execute()

    if not res.data:
        raise HTTPException(404, "User not found")

    user = res.data[0]
    current_status = user["Account_status"]
    new_status = "INACTIVE" if current_status == "ACTIVE" else "ACTIVE"

    # Update status
    supabase.table("User") \
        .update({"Account_status": new_status}) \
        .eq("id", user_id) \
        .execute()

    # Email content
    if new_status == "INACTIVE":
        subject = "Account Deactivated"
        body = f"""
Hello {user['name']},

Your account has been DEACTIVATED by the administrator.

You will no longer be able to log in until your account is reactivated.

If you believe this is a mistake, please contact support.
"""
    else:
        subject = "Account Activated"
        body = f"""
Hello {user['name']},

Good news! Your account has been ACTIVATED.

You can now log in to the system using your credentials.

If you have any issues, please contact support.
"""

    # Send email
    send_email(user["email"], subject, body)

    return {
        "success": True,
        "new_status": new_status,
        "message": f"User account {new_status.lower()} and email sent"
    }

# -------------------------------
# OTP EMAIL
# -------------------------------
@app.post("/send_recovery_email")
def send_otp(req: EmailRequest):

    user = supabase.table("User") \
        .select("email") \
        .eq("email", req.email).execute()

    if not user.data:
        raise HTTPException(404, "Email not found")

    otp = str(random.randint(100000, 999999))

    otp_store[req.email] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }

    send_email(
        req.email,
        "Password Recovery OTP",
        f"Your OTP code is: {otp}\nExpires in 5 minutes."
    )

    return {"success": True, "message": "OTP Sent"}

# -------------------------------
# VERIFY OTP
# -------------------------------
@app.post("/verify_otp")
def verify_otp(req: OTPVerifyRequest):

    record = otp_store.get(req.email)

    if not record:
        raise HTTPException(404, "OTP not found")

    if datetime.utcnow() > record["expires_at"]:
        otp_store.pop(req.email)
        raise HTTPException(400, "OTP expired")

    if req.otp != record["otp"]:
        raise HTTPException(400, "Invalid OTP")

    otp_store.pop(req.email)
    return {"success": True}

# -------------------------------
# RESET PASSWORD - FIRST LOGIN
# -------------------------------
@app.post("/reset_password_first_login")
def reset_first_login(req: ResetPasswordRequest):

    user = supabase.table("User") \
        .select("id,hashed_password") \
        .eq("username", req.username).execute()

    if not user.data:
        raise HTTPException(404, "User not found")

    current_hash = user.data[0]["hashed_password"]

    if not bcrypt.checkpw(
        req.current_password.encode(),
        current_hash.encode()
    ):
        raise HTTPException(401, "Current password incorrect")

    new_hash = bcrypt.hashpw(
        req.new_password.encode(),
        bcrypt.gensalt()
    ).decode()

    supabase.table("User").update({
        "hashed_password": new_hash,
        "temp_password": False
    }).eq("username", req.username).execute()

    return {"success": True, "message": "Password updated"}

# -------------------------------
# FORGOT PASSWORD RESET
# -------------------------------
@app.post("/reset_password_forgot")
def reset_forgot(req: ResetPasswordForgotRequest):

    user = supabase.table("User") \
        .select("id") \
        .eq("email", req.email).execute()

    if not user.data:
        raise HTTPException(404, "Email not found")

    new_hash = bcrypt.hashpw(
        req.new_password.encode(),
        bcrypt.gensalt()
    ).decode()

    supabase.table("User").update({
        "hashed_password": new_hash,
        "temp_password": False
    }).eq("email", req.email).execute()

    return {"success": True, "message": "Password reset"}

# -------------------------------
# COMPLETE PROFILE (legacy endpoint)
# -------------------------------
@app.post("/api/complete_profile")
def complete_profile(data: CompleteProfileRequest):
    # Validate date format
    try:
        datetime.strptime(data.date_of_birth, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "Invalid date format (YYYY-MM-DD)")

    # Find user by username
    user_res = supabase.table("User").select("id").eq("username", data.username).execute()
    if not user_res.data:
        raise HTTPException(404, "User not found")

    user_id = user_res.data[0]["id"]

    # Update profile
    supabase.table("User").update({
        "ic_number": data.ic_number,
        "date_of_birth": data.date_of_birth,
        "phone_number": data.phone_number,
        "school_name": data.school_name,
        "mother_name": data.mother_name,
    }).eq("id", user_id).execute()

    return {"success": True, "message": "Profile completed successfully", "user_id": user_id}

# -------------------------------
# VERIFY SECURITY QUESTIONS
# -------------------------------
@app.post("/verify_security_questions")
def verify_security_questions(data: VerifySecurityQuestionsRequest):
    # Step 1: Check if email exists
    user_res = supabase.table("User").select(
        "id, school_name, mother_name"
    ).eq("email", data.email).execute()

    if not user_res.data:
        raise HTTPException(404, "Email not found")

    user = user_res.data[0]

    # Step 2: Verify security question answers (case-insensitive)
    if (
        user.get("school_name", "").strip().lower() != data.school_name.strip().lower() or
        user.get("mother_name", "").strip().lower() != data.mother_name.strip().lower()
    ):
        raise HTTPException(400, "Security answers do not match")

    # Step 3: If verified, generate and store OTP
    otp = str(random.randint(100000, 999999))
    otp_store[data.email] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }

    # Send OTP via email
    send_email(
        data.email,
        "Password Recovery OTP",
        f"Your OTP code is: {otp}\nExpires in 5 minutes."
    )

    return {"success": True, "message": "Security answers verified and OTP sent"}

# -------------------------------
# UNIFIED USER UPDATE (profile + username/email + password)
# -------------------------------
@app.put("/api/users/{user_id}")
def update_user(user_id: int, data: UserFlexibleUpdate):
    # Fetch current user
    res = supabase.table("User").select("id,username,email,hashed_password").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(404, "User not found")
    current_user = res.data[0]

    update_data = {k: v for k, v in data.dict().items() if v is not None}

    # Username uniqueness check
    if data.username and data.username != current_user["username"]:
        existing = supabase.table("User").select("id").eq("username", data.username).execute()
        if existing.data:
            raise HTTPException(400, "Username already exists")

    # Email uniqueness check
    if data.email and data.email != current_user["email"]:
        existing = supabase.table("User").select("id").eq("email", data.email).execute()
        if existing.data:
            raise HTTPException(400, "Email already exists")

    # Optional date validation if provided
    if data.date_of_birth:
        try:
            datetime.strptime(data.date_of_birth, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(400, "Invalid date format (YYYY-MM-DD)")

    # Handle password change
    if data.new_password:
        if not data.current_password:
            raise HTTPException(400, "Current password required to change password")
        current_hash = current_user["hashed_password"]
        if not bcrypt.checkpw(data.current_password.encode(), current_hash.encode()):
            raise HTTPException(401, "Current password incorrect")
        new_hash = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
        update_data["hashed_password"] = new_hash
        update_data["temp_password"] = False

    # Remove sensitive fields
    update_data.pop("current_password", None)
    update_data.pop("new_password", None)

    # Perform update
    result = supabase.table("User").update(update_data).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(404, "User not found after update")

    return {"success": True, "user": result.data[0]}

@app.get("/api/reports/summary")
def get_reports_summary():
    # Fetch all reports
    res = supabase.table("Report").select(
        "report_id,status,report_type,inspection_date"
    ).execute()

    if not res.data:
        return {
            "success": True,
            "totalReports": 0,
            "byStatus": {},
            "byType": {},
            "byDate": {}
        }

    reports = res.data

    # Aggregate counts
    total_reports = len(reports)

    by_status = {}
    by_type = {}
    by_date = {}

    for r in reports:
        # Status
        status = r.get("status") or "UNKNOWN"
        by_status[status] = by_status.get(status, 0) + 1

        # Type
        rtype = r.get("report_type") or "UNSPECIFIED"
        by_type[rtype] = by_type.get(rtype, 0) + 1

        # Date
        date = r.get("inspection_date") or "NO_DATE"
        by_date[date] = by_date.get(date, 0) + 1

    return {
        "success": True,
        "totalReports": total_reports,
        "byStatus": by_status,
        "byType": by_type,
        "byDate": by_date,
    }


@app.get("/api/activity/reports")
def get_recent_reports():
    res = supabase.table("Report").select(
        "title,created_at,created_by"
    ).order("created_at", desc=True).limit(10).execute()

    enriched = []
    for r in res.data:
        user = supabase.table("User").select("username").eq("id", r["created_by"]).execute()
        generated_by = user.data[0]["username"] if user.data else "Unknown"
        enriched.append({
            "title": r["title"],
            "created_at": r["created_at"],
            "generated_by": generated_by
        })

    return {"success": True, "activities": enriched}

# -------------------------------
# DASHBOARD ENDPOINTS
# -------------------------------

@app.get("/dashboard/user_summary/{user_id}", response_model=DashboardSummary)
def get_user_summary(user_id: int):
    # Distinct inspections
    inspections_res = (
        supabase.table("Report")
        .select("inspection_id")
        .eq("created_by", user_id)
        .execute()
    )
    inspections = len({r["inspection_id"] for r in inspections_res.data if r.get("inspection_id")})

    # Photos uploaded
    photos_res = (
        supabase.table("Photo")
        .select("id")   # ✅ use actual column name
        .eq("uploaded_by", user_id)
        .execute()
    )
    photos = len(photos_res.data)

    # Reports generated
    reports_res = (
        supabase.table("Report")
        .select("report_id")   # ✅ use actual column name
        .eq("created_by", user_id)
        .execute()
    )
    reports = len(reports_res.data)

    return DashboardSummary(
        success=True,
        totalInspections=inspections,
        photosUploaded=photos,
        reportsGenerated=reports
    )


@app.get("/dashboard/reports_by_status/{user_id}")
def reports_by_status(user_id: int):
    res = (
        supabase.table("Report")
        .select("status")
        .eq("created_by", user_id)
        .execute()
    )
    counts = {}
    for r in res.data:
        status = r.get("status") or "UNKNOWN"
        counts[status] = counts.get(status, 0) + 1
    return {"success": True, "byStatus": counts}


@app.get("/dashboard/reports_trend/{user_id}")
def reports_trend(user_id: int):
    res = (
        supabase.table("Report")
        .select("created_at")
        .eq("created_by", user_id)
        .execute()
    )
    trend = {}
    for r in res.data:
        date = r.get("created_at", "")[:10]  # YYYY-MM-DD
        trend[date] = trend.get(date, 0) + 1
    return {"success": True, "trend": trend}


@app.get("/dashboard/recent_activity/{user_id}")
def recent_activity(user_id: int):
    res = (
        supabase.table("Report")
        .select("title,created_at,status")
        .eq("created_by", user_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    return {"success": True, "activities": res.data}
