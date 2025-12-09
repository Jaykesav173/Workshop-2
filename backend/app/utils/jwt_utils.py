"""
JWT Token Utilities
Handles JWT token creation and verification
"""
import jwt
from datetime import datetime, timedelta
from app.config import settings

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """
    Verify JWT token and return payload
    Returns None if token is invalid
    """
    try:
        print(f"\n🔍 JWT VERIFICATION DEBUG:")
        print(f"   Token length: {len(token) if token else 0}")
        print(f"   Token preview: {token[:50] if token else 'None'}...")
        print(f"   SECRET_KEY length: {len(settings.SECRET_KEY) if settings.SECRET_KEY else 0}")
        print(f"   Algorithm: {settings.ALGORITHM}")
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"   ✅ Token verified successfully!")
        print(f"   Payload: {payload}")
        return payload
    except jwt.ExpiredSignatureError as e:
        print(f"   ❌ Token expired: {str(e)}")
        return None
    except jwt.InvalidTokenError as e:
        print(f"   ❌ Invalid token: {str(e)}")
        return None
    except Exception as e:
        print(f"   ❌ Token verification error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

