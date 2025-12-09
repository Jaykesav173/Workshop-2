"""
Response Models
Standardized response formats for API endpoints
"""
from pydantic import BaseModel
from typing import Optional, Any

class StandardResponse(BaseModel):
    """Standard API response model"""
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    detail: Optional[str] = None

