"""
Pydantic Schemas for Request/Response Models
Data validation and serialization

Schemas for 4 core models:
1. User - Haifa (User Authentication)
2. Photo - Asillah (Photo Upload)
3. Equipment - Yi Jing (Equipment Information)
4. Report - Abdalla (Intelligent Report Generation) & Jay (Report History & Review)
"""
from pydantic import BaseModel, EmailStr, field_validator
from datetime import date, time
from datetime import datetime
from typing import Optional, List

# ============================================
# 1. User Schemas - Haifa (User Authentication)
# ============================================
class UserBase(BaseModel):
    name: str
    email: EmailStr
    username: str
    role: Optional[str] = None

class UserCreate(UserBase):
    password: str
    Account_status: str = "ACTIVE"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    phone_number: Optional[str] = None
    ic_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    school_name: Optional[str] = None
    mother_name: Optional[str] = None

class UserResponse(UserBase):
    id: int
    Account_status: Optional[str] = "ACTIVE"
    created_at: Optional[datetime] = None
    
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

class EmailRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    username: str
    current_password: str
    new_password: str

class ResetPasswordForgotRequest(BaseModel):
    email: EmailStr
    new_password: str

class VerifySecurityQuestionsRequest(BaseModel):
    email: EmailStr
    school_name: str
    mother_name: str

class CompleteProfileRequest(BaseModel):
    username: str
    ic_number: str
    date_of_birth: str
    phone_number: str
    school_name: str
    mother_name: str

# ============================================
# 2. Equipment Schemas - Yi Jing (Equipment Information)
# Updated to match Supabase schema: public.equipment
# ============================================
class EquipmentBase(BaseModel):
    equipment_tag_no: Optional[str] = None  # Equipment tag number (unique) - can be null in DB
    type_id: Optional[int] = None  # FK to type table
    material: Optional[str] = None  # Material of construction
    location: Optional[str] = None  # Plant/Unit/Area location
    inspection_due_date: Optional[datetime] = None  # Next inspection due date
    equipment_description: Optional[str] = None  # Full equipment description
    dosh_registration_no: Optional[str] = None  # DOSH registration number
    material_id: Optional[int] = None  # FK to Material Table
    nominal_thickness: Optional[float] = None  # Nominal thickness
    corrosion_allowance: Optional[float] = None  # Corrosion allowance
    design_pressure: Optional[float] = None  # Design pressure
    design_temperature: Optional[float] = None  # Design temperature
    status: Optional[str] = "ACTIVE"  # Status default ACTIVE

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentResponse(EquipmentBase):
    id: int
    status: str  # Active, Inactive, Decommissioned
    created_at: datetime
    updated_at: Optional[datetime] = None
    name: Optional[str] = None  # Alias for equipment_tag_no
    type: Optional[str] = None  # Type description (from type table if available)
    
    # Image fields
    image_url: Optional[str] = None
    photos: Optional[list] = []

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

# New schema to represent what GPT-4o returns
class AIFindings(BaseModel):
    description: str
    recommendation: str
    category: str
    severity: str
    box_2d: List[float] = []

class PhotoCreate(PhotoBase):
    ai_description: Optional[str] = None
    ai_recommendation: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    box_2d: Optional[List[float]] = []

class PhotoResponse(PhotoBase):
    id: int
    uploaded_by: int
    storage_url: Optional[str] = None
    uploaded_at: datetime
    # Add these so the UI can show previous analysis
    ai_description: Optional[str] = None
    ai_recommendation: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    box_2d: Optional[List[float]] = []
    
    class Config:
        from_attributes = True

# ============================================
# 5. Inspection Schemas - Asillah (Inspection Workflow)
# Matches database schema: public."Inspection"
# ============================================
class InspectionBase(BaseModel):
    inspection_date: datetime
    equipment_tag_no: Optional[str] = None  # Will be fetched from equipment_id if provided
    defect_type: Optional[str] = None
    remarks: Optional[str] = None
    user_id: Optional[int] = None  # FK to User(id) - set by backend from JWT
    inspection_type: Optional[str] = None
    status: Optional[str] = "Draft"
    priority: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    next_inspection_date: Optional[datetime] = None
    remarks_general: Optional[str] = None
    findings_summary: Optional[str] = None
    plant_unit_area: Optional[str] = None  # Plant/Unit/Area location - required when creating inspection

class InspectionCreate(InspectionBase):
    # Allow equipment_id from frontend, will be converted to equipment_tag_no
    equipment_id: Optional[int] = None
    # Make inspection_date optional in create (will default to now if not provided)
    inspection_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class InspectionResponse(InspectionBase):
    inspection_id: int  # Primary key
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# 6. Observation Schemas - Asillah (Inspection Workflow)
# Matches database schema: public."Observation"
# ============================================
class FindingBase(BaseModel):
    key: str  # e.g., "1.1", "1.2", "2.1"
    text: str

class RecommendationBase(BaseModel):
    key: str  # e.g., "1.1", "1.2", "2.1"
    text: str

class ObservationBase(BaseModel):
    inspection_id: int
    component: str
    location: Optional[str] = None
    observation_type: Optional[str] = None
    severity: Optional[str] = None
    status: str = "OPEN"
    priority: str = "MEDIUM"
    action_required: Optional[str] = None

class ObservationCreate(ObservationBase):
    findings: list[FindingBase] = []
    recommendations: list[RecommendationBase] = []

class ObservationResponse(ObservationBase):
    observation_id: int
    findings: list[FindingBase] = []
    recommendations: list[RecommendationBase] = []
    created_at: datetime
    updated_at: datetime
    
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
    api_510_compliant: bool = False

class ReportCreate(ReportBase):
    pass

class ReportResponse(ReportBase):
    report_id: str  # UUID string (primary key in database)
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
    report_no: Optional[str] = None  # Formatted report number (extracted from content JSON)
    
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

# ============================================
# API-510 Detailed Report Schemas - Abdalla (Report Generation)
# ============================================
class ReportHeader(BaseModel):
    equipment_tag: str
    equipment_description: str
    plant: str
    dosh_no: str
    report_no: str
    report_date: str
    inspector_name: str
    reviewed_by: Optional[str] = None
    client_approver: Optional[str] = None
    inspection_type: Optional[str] = "VI"  # Default to "VI" for Visual Inspection
    turnaround_code: Optional[str] = None  # Auto-generated from report_date if not provided

class FindingItem(BaseModel):
    key: str  # e.g., "1.1", "2.3"
    text: str

class RecommendationItem(BaseModel):
    key: str  # e.g., "2.2", "2.5"
    text: str

class PhotoItem(BaseModel):
    finding_key: str  # e.g., "7.1"
    finding_text: str
    recommendation_text: str
    storage_url: Optional[str] = None  # URL to photo
    file_path: Optional[str] = None  # Local file path if available

class API510ReportRequest(BaseModel):
    inspection_id: Optional[int] = None
    equipment_id: Optional[int] = None
    header: ReportHeader
    findings: list[FindingItem]
    recommendations: list[RecommendationItem]
    photos: list[PhotoItem]
    ndt_text: Optional[str] = None  # NDT section text
    initial_inspection_text: Optional[str] = "Initial/Pre-Inspection — Not applicable"



# SCHEDULE MODULE SCHEMAS - ASILLAH
class ScheduleBase(BaseModel):
    equipment_id: int
    equipment_type: Optional[str] = None
    safety_category: Optional[str] = None
    location: Optional[str] = None
    inspector_id: int
    scheduled_date: date
    start_time: time
    end_time: time
    priority: str = "Medium"
    details: Optional[str] = None

    # Backend Guard: Prevents logic errors if frontend validation is bypassed
    @field_validator('end_time')
    @classmethod
    def check_time_logic(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('End Time must be later than Start Time')
        return v

class ScheduleCreate(ScheduleBase):
    engineer_id: int
    inspector_email: Optional[EmailStr] = None

class ScheduleResponse(ScheduleBase):
    schedule_id: int
    engineer_id: Optional[int] = None
    status: str

    class Config:
        from_attributes = True

# ============================================
# Template Management Schemas
# ============================================
class FindingTemplateBase(BaseModel):
    label: str
    text: str
    is_active: Optional[str] = "ACTIVE"

class FindingTemplateCreate(FindingTemplateBase):
    pass

class FindingTemplateUpdate(BaseModel):
    label: Optional[str] = None
    text: Optional[str] = None
    is_active: Optional[str] = None

class FindingTemplateResponse(FindingTemplateBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class RecommendationTemplateBase(BaseModel):
    label: str
    text: str
    is_active: Optional[str] = "ACTIVE"

class RecommendationTemplateCreate(RecommendationTemplateBase):
    pass

class RecommendationTemplateUpdate(BaseModel):
    label: Optional[str] = None
    text: Optional[str] = None
    is_active: Optional[str] = None

class RecommendationTemplateResponse(RecommendationTemplateBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Feedback/Review Schemas
class SectionFeedbackCreate(BaseModel):
    section_name: str
    feedback: str

class ReportReviewCreate(BaseModel):
    report_id: str
    status: str  # Approved, Pending, Rejected
    feedback_items: List[SectionFeedbackCreate] = []

class SectionFeedbackResponse(SectionFeedbackCreate):
    feedback_id: int
    review_id: int

    class Config:
        from_attributes = True

class ReportReviewResponse(ReportReviewCreate):
    review_id: int
    reviewed_by: str
    reviewed_at: datetime
    feedback_items: List[SectionFeedbackResponse] = []


    class Config:
        from_attributes = True


class ReportReviewItem(BaseModel):
    report_id: str
    report_title: Optional[str] = None
    inspection_date: Optional[datetime] = None
    equipment_tag: Optional[str] = None
    equipment_location: Optional[str] = None
    created_at: Optional[datetime] = None
    inspector_name: Optional[str] = None
    status: str
    created_by: Optional[int] = None

    class Config:
        from_attributes = True

class ReportDetailItem(ReportReviewItem):
    content: Optional[str] = None
    labeled_photos: Optional[str] = None
    labeled_defects: Optional[str] = None
    defect_types_summary: Optional[str] = None
    report_type: Optional[str] = None
    pdf_url: Optional[str] = None
    report_url: Optional[str] = None
    api_510_compliant: bool = False
    
    # Extra fields for display
    equipment_description: Optional[str] = None
    dosh_registration_no: Optional[str] = None
    
    # Feedback Items
    feedback_items: Optional[List[SectionFeedbackResponse]] = []


