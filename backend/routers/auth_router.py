from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt, jwt, os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = os.getenv("SECRET_KEY", "mysecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Temporary in-memory database (for testing)
users_db = {}

# User model
class User(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(user: User):
    if user.username in users_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    users_db[user.username] = hashed_pw
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: User):
    if user.username not in users_db:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    hashed_pw = users_db[user.username]
    if not bcrypt.checkpw(user.password.encode('utf-8'), hashed_pw):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    token = jwt.encode({"sub": user.username}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}
