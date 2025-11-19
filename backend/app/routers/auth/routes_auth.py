"""
Authentication Routes - Haifa
API endpoints for user authentication
"""
from fastapi import APIRouter, HTTPException, Depends
from app.database.schemas import LoginRequest, LoginResponse, UserCreate, UserResponse
from app.routers.auth.service_auth import AuthService
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

auth_service = AuthService()

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """User login endpoint"""
    return await auth_service.login(credentials)

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """User registration endpoint"""
    return await auth_service.register(user_data)

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information"""
    return current_user

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """User logout endpoint"""
    return {"message": "Logged out successfully"}

