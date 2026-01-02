"""
User Roles Routes - Haifa
API endpoints for user management and role assignment
"""
from fastapi import APIRouter, HTTPException, Depends
from app.database.schemas import UserResponse, UserCreate, UserUpdate
from app.routers.user_roles.service_user_roles import UserRolesService
from app.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["User Roles"])

user_roles_service = UserRolesService()

@router.post("/", response_model=dict)
async def create_user(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    """Create a new user (admin only)"""
    return await user_roles_service.create_user(user_data)

@router.get("/", response_model=list[UserResponse])
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """Get all users (admin only)"""
    return await user_roles_service.get_all_users()

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, current_user: dict = Depends(get_current_user)):
    """Get user by ID"""
    return await user_roles_service.get_user(user_id)

@router.patch("/{user_id}/status")
async def toggle_user_status(user_id: int, current_user: dict = Depends(get_current_user)):
    """Toggle user account status (ACTIVE/INACTIVE)"""
    return await user_roles_service.toggle_user_status(user_id)

@router.patch("/{user_id}/role")
async def update_user_role(user_id: int, new_role: str, current_user: dict = Depends(get_current_user)):
    """Update user role"""
    return await user_roles_service.update_user_role(user_id, new_role)

@router.put("/{user_id}", response_model=dict)
async def update_user_profile(user_id: int, user_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile"""
    # Allow users to update their own profile, or admins to update anyone
    if current_user["role"] != "ADMIN" and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    
    return await user_roles_service.update_user_profile(user_id, user_data.model_dump(exclude_unset=True))

