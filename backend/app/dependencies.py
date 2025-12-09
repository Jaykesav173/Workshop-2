"""
Shared FastAPI dependencies
Common dependencies used across multiple routers
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.utils.jwt_utils import verify_token
from app.database.connection import get_db

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Dependency to get current authenticated user from JWT token
    """
    token = credentials.credentials
    print(f"\n🔐 AUTHENTICATION CHECK:")
    print(f"   Received token: {token[:50] if token else 'None'}...")
    payload = verify_token(token)
    if payload is None:
        print(f"   ❌ Authentication failed - invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print(f"   ✅ Authentication successful - user: {payload.get('sub', 'Unknown')}")
    return payload

async def get_db_session():
    """
    Dependency to get database session
    """
    return get_db()


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)
):
    """
    Dependency that returns the current user if a valid token is provided.
    Returns None when no/invalid token is supplied (used for public endpoints).
    """
    if credentials is None:
        return None

    payload = verify_token(credentials.credentials)
    if payload is None:
        return None
    return payload

