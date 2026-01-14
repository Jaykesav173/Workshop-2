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

from app.database.schemas import (
    VerifySecurityQuestionsRequest, 
    EmailRequest, 
    OTPVerifyRequest, 
    ResetPasswordRequest, 
    ResetPasswordForgotRequest
)

@router.post("/verify_security_questions")
async def verify_security_questions(data: VerifySecurityQuestionsRequest):
    """Verify security questions and send OTP"""
    return await auth_service.verify_security_questions(data)

@router.post("/send_recovery_email")
async def send_recovery_email(req: EmailRequest):
    """Send password recovery email"""
    return await auth_service.send_recovery_email(req.email)

@router.post("/verify_otp")
async def verify_otp(req: OTPVerifyRequest):
    """Verify OTP"""
    return await auth_service.verify_otp(req.email, req.otp)

@router.post("/reset_password_first_login")
async def reset_password_first_login(req: ResetPasswordRequest):
    """Reset password on first login"""
    return await auth_service.reset_password_first_login(req.username, req.current_password, req.new_password)

@router.post("/reset_password_forgot")
async def reset_password_forgot(req: ResetPasswordForgotRequest):
    """Reset password after forgot password"""
    return await auth_service.reset_password_forgot(req.email, req.new_password)

