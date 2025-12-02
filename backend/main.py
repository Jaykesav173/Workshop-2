import bcrypt
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from database import supabase  # Your Supabase client
from datetime import datetime

app = FastAPI()
logger = logging.getLogger(__name__)

# -------------------------------
# CORS
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # optional: allow all
        "http://localhost:5173",  # frontend dev machine
        "http://172.20.10.11:5173",
        "http://172.20.10.2:5173"   # backend machine
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# MODELS
# -------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str
    role: str  # 'ADMIN', 'INSPECTOR', 'USER'
    Account_status: str = "ACTIVE"

# -------------------------------
# LOGIN ENDPOINT
# -------------------------------
@app.post("/api/login")
def login_user(data: LoginRequest):
    try:
        res = supabase.table("User").select(
            "id, username, hashed_password, role, \"Account_status\""
        ).eq("username", data.username).execute()

        if not res.data:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        user = res.data[0]

        if user["Account_status"] != "ACTIVE":
            raise HTTPException(status_code=403, detail="Account inactive. Please contact admin.")

        if not bcrypt.checkpw(data.password.encode("utf-8"), user["hashed_password"].encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "role": user["role"]
            }
        }

    except Exception as e:
        logger.error("Login error: %s", e)
        raise HTTPException(status_code=500, detail="Server error during login")

# -------------------------------
# GET ALL USERS
# -------------------------------
@app.get("/api/users")
def get_users():
    try:
        res = supabase.table("User").select(
            "id, name, email, username, role, \"Account_status\", created_at"
        ).execute()

        if res.data:
            return {"success": True, "users": res.data}
        return {"success": False, "message": "No users found"}

    except Exception as e:
        logger.error("Get users error: %s", e)
        raise HTTPException(status_code=500, detail="Server error while fetching users")

# -------------------------------
# ADD NEW USER
# -------------------------------
@app.post("/api/users")
def add_user(data: UserCreate):
    try:
        # Check for duplicates
        existing = supabase.table("User").select("id").or_(
            f"username.eq.{data.username},email.eq.{data.email}"
        ).execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="Username or email already exists")

        # Hash password
        hashed_pw = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        new_user = {
            "name": data.name,
            "email": data.email,
            "username": data.username,
            "hashed_password": hashed_pw,
            "role": data.role,
            "Account_status": data.Account_status,
            "created_at": str(datetime.utcnow())
        }

        res = supabase.table("User").insert(new_user).execute()

        if res.data:
            user = res.data[0]
            user.pop("hashed_password", None)
            return {"success": True, "user": user}
        else:
            raise HTTPException(status_code=400, detail="Failed to add user")

    except Exception as e:
        logger.error("Add user error: %s", e)
        raise HTTPException(status_code=500, detail="Server error while adding user")

# -------------------------------
# TOGGLE USER STATUS
# -------------------------------
@app.patch("/api/users/{user_id}/status")
def toggle_user_status(user_id: int):
    try:
        # Step 1: Fetch current status
        res = supabase.table("User").select('"Account_status"').eq("id", user_id).execute()

        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

        current_status = res.data[0]["Account_status"]
        if current_status not in ["ACTIVE", "INACTIVE"]:
            raise HTTPException(status_code=400, detail=f"Invalid current status: {current_status}")

        # Step 2: Toggle status
        new_status = "INACTIVE" if current_status == "ACTIVE" else "ACTIVE"

        # Step 3: Update status
        update_res = supabase.table("User").update({"Account_status": new_status}).eq("id", user_id).execute()

        if not update_res.data:
            raise HTTPException(status_code=500, detail="Failed to update user status")

        # Step 4: Return success
        return {"success": True, "new_status": new_status}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Server error while updating status")

from app.routers.equipment.routes_equipment import router as equipment_router
from fastapi.staticfiles import StaticFiles
from app.config import settings
import os

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount static files
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(equipment_router, prefix="/api")
