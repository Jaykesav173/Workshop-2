import bcrypt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import supabase  # Supabase client
from datetime import datetime

app = FastAPI()

# -------------------------------
# ✅ CORS
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000", "http://172.20.10.2:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# ✅ MODELS
# -------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    email: str
    username: str
    password: str
    name: str

# -------------------------------
# ✅ SIGNUP ENDPOINT
# -------------------------------
@app.post("/api/signup")
def signup_user(data: SignupRequest):
    # Check if username already exists
    existing_user = supabase.table("User").select("*").eq("username", data.username).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Hash the password
    hashed_password = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Prepare new user data
    new_user = {
        "name": data.name,
        "email": data.email,
        "username": data.username,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow().isoformat()
    }

    # Insert into Supabase
    response = supabase.table("User").insert(new_user).execute()

    if getattr (response, "error" , None):
        raise HTTPException (status_code = 500, detail=str(response.error))
    
    return{
        "message": "User created successfully",
        "user": response.data[0]
    }
# -------------------------------
# ✅ LOGIN ENDPOINT
# -------------------------------
@app.post("/api/login")
def login_user(data: LoginRequest):
    # Fetch user by username
    response = supabase.table("User").select("*").eq("username", data.username).execute()

    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user = response.data[0]

    # Verify password
    if not bcrypt.checkpw(data.password.encode("utf-8"), user["hashed_password"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful", "user": user}

# -------------------------------
# ✅ ROOT TEST
# -------------------------------
@app.get("/")
def read_root():
    return {"message": "Backend is running successfully!"}
 