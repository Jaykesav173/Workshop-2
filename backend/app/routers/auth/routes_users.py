"""
User Management Routes
API endpoints for managing users (Admin only)
"""
from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth.service_auth import AuthService
from app.dependencies import get_current_user

router = APIRouter(tags=["Users"])

auth_service = AuthService()

@router.get("")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """Get all users (Admin only)"""
    # Check if user is admin
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return await auth_service.get_all_users()

@router.patch("/{user_id}/status")
async def toggle_status(user_id: int, current_user: dict = Depends(get_current_user)):
    """Toggle user status (Admin only)"""
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return await auth_service.toggle_user_status(user_id)
