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
    
    async def login(self, credentials: LoginRequest) -> LoginResponse:
        """Authenticate user and return JWT token"""
        try:
            res = self.db.table("User").select(
                "id, username, hashed_password, role, \"Account_status\""
            ).eq("username", credentials.username).execute()
            
            if not res.data:
                raise HTTPException(status_code=401, detail="Invalid username or password")
            
            user = res.data[0]
            
            if user["Account_status"] != "ACTIVE":
                raise HTTPException(status_code=403, detail="Account inactive. Please contact admin.")
            
            # Get stored hash - handle both string and bytes
            stored_hash = user["hashed_password"]
            if isinstance(stored_hash, bytes):
                stored_hash = stored_hash.decode("utf-8")
            
            # Verify password
            password_bytes = credentials.password.encode("utf-8")
            hash_bytes = stored_hash.encode("utf-8")
            
            if not bcrypt.checkpw(password_bytes, hash_bytes):
                raise HTTPException(status_code=401, detail="Invalid username or password")
            
            # Create JWT token
            token = create_access_token(data={"sub": user["username"], "id": user["id"], "role": user["role"]})
            
            return LoginResponse(
                success=True,
                message="Login successful",
                access_token=token,
                user={
                    "id": user["id"],
                    "username": user["username"],
                    "role": user["role"]
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

