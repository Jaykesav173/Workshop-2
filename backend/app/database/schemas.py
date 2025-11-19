"""
Pydantic Schemas for Request/Response Models
Data validation and serialization

Schemas for 4 core models:
1. User - Haifa (User Authentication)
2. Photo - Asillah (Photo Upload)
3. Equipment - Yi Jing (Equipment Information)
4. Report - Abdalla (Intelligent Report Generation) & Jay (Report History & Review)
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# ============================================
# 1. User Schemas - Haifa (User Authentication)
# ============================================
class UserBase(BaseModel):
    name: str
    email: EmailStr
    username: str
    role: str

class UserCreate(UserBase):
    password: str
    Account_status: str = "ACTIVE"

class UserResponse(UserBase):
    id: int
    Account_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    user: Optional[dict] = None

# ============================================
# 2. Equipment Schemas - Yi Jing (Equipment Information)
# ============================================
class EquipmentBase(BaseModel):
    name: str
    type: str
    location: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    installation_date: Optional[datetime] = None

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentResponse(EquipmentBase):
    id: int
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ============================================
# 3. Photo Schemas - Asillah (Photo Upload)
# ============================================
class PhotoBase(BaseModel):
    equipment_id: Optional[int] = None
    file_path: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None

class PhotoCreate(PhotoBase):
    pass

class PhotoResponse(PhotoBase):
    id: int
    uploaded_by: int
    storage_url: Optional[str] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# 4. Report Schemas - Abdalla (Intelligent Report Generation) & Jay (Report History & Review)
# ============================================
class ReportBase(BaseModel):
    equipment_id: Optional[int] = None
    title: Optional[str] = None
    content: Optional[str] = None
    report_type: str = "API_510"
    inspection_date: Optional[datetime] = None
    next_inspection_due: Optional[datetime] = None
    api_510_compliant: str = "YES"

class ReportCreate(ReportBase):
    pass

class ReportResponse(ReportBase):
    id: int
    created_by: int
    report_path: Optional[str] = None
    report_url: Optional[str] = None
    pdf_path: Optional[str] = None
    pdf_url: Optional[str] = None
    labeled_photos: Optional[str] = None  # JSON string
    labeled_defects: Optional[str] = None  # JSON string
    inspection_frequency: Optional[str] = None
    defect_types_summary: Optional[str] = None  # JSON string
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Report Search Schema - Jay (Report History & Review)
class ReportSearchRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    equipment_id: Optional[int] = None
    inspector_id: Optional[int] = None  # created_by
    status: Optional[str] = None
    report_type: Optional[str] = None

