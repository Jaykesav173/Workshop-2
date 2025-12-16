"""
SQLAlchemy Database Models
Define database table structures

Models:
1. User - Haifa (User Authentication)
2. Photo - Asillah (Photo Upload)
3. Equipment - Yi Jing (Equipment Information)
4. Report - Abdalla (Intelligent Report Generation) & Jay (Report History & Review)
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

# 1. User Model - Haifa (User Authentication)
class User(Base):
    __tablename__ = "User"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'ADMIN', 'INSPECTOR', 'USER'
    Account_status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 2. Equipment Model - Yi Jing (Equipment Information)
# Updated to match Supabase schema: public.equipment
class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_tag_no = Column(String, nullable=False, unique=True)  # Equipment tag number (unique)
    type_id = Column(Integer, ForeignKey("type.id"), nullable=True)  # FK to type table
    material = Column(String, nullable=True)  # Material of construction
    location = Column(String, nullable=True)  # Plant/Unit/Area location
    inspection_due_date = Column(DateTime, nullable=True)  # Next inspection due date
    equipment_description = Column(Text, nullable=True)  # Full equipment description
    dosh_registration_no = Column(Text, nullable=True)  # DOSH registration number
    nominal_thickness = Column(Integer, nullable=True)  # Nominal thickness (numeric)
    corrosion_allowance = Column(Integer, nullable=True)  # Corrosion allowance (numeric)
    design_pressure = Column(Integer, nullable=True)  # Design pressure (numeric)
    design_temperature = Column(Integer, nullable=True)  # Design temperature (numeric)
    status = Column(String, default="Active")  # Active, Inactive, Decommissioned
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 3. Photo Model - Asillah (Photo Upload)
class Photo(Base):
    __tablename__ = "Photo"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("Equipment.id"), nullable=True)  # Optional link to equipment
    uploaded_by = Column(Integer, ForeignKey("User.id"), nullable=False)  # Who uploaded the photo
    file_path = Column(String, nullable=False)
    storage_url = Column(String)  # Supabase storage URL
    file_name = Column(String)
    file_size = Column(Integer)  # Size in bytes
    uploaded_at = Column(DateTime, default=datetime.utcnow)

# 4. Report Model - Abdalla (Intelligent Report Generation) & Jay (Report History & Review)
class Report(Base):
    __tablename__ = "Report"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("Equipment.id"), nullable=True, index=True)  # Which equipment this report is for (searchable)
    created_by = Column(Integer, ForeignKey("User.id"), nullable=False, index=True)  # Inspector who created the report (searchable)
    report_path = Column(String)  # Local file path
    report_url = Column(String)  # Supabase storage URL
    pdf_path = Column(String)  # PDF file path for API 510 export
    pdf_url = Column(String)  # PDF Supabase storage URL
    report_type = Column(String, default="API_510")  # Type of report (API_510, INSPECTION, etc.)
    title = Column(String)
    content = Column(Text)  # Report content/description
    # API 510 Compliance Fields
    api_510_compliant = Column(String, default="YES")  # YES, NO, PENDING
    inspection_date = Column(DateTime, nullable=True, index=True)  # Date of inspection (searchable)
    next_inspection_due = Column(DateTime, nullable=True)  # Next inspection due date
    # Auto-labeled data (JSON stored as Text)
    labeled_photos = Column(Text, nullable=True)  # JSON array of photo labels
    labeled_defects = Column(Text, nullable=True)  # JSON array of defect labels
    # Analytics data (for Jay's module)
    inspection_frequency = Column(String, nullable=True)  # Frequency of inspections
    defect_types_summary = Column(Text, nullable=True)  # JSON summary of defect types
    status = Column(String, default="DRAFT")  # DRAFT, COMPLETED, ARCHIVED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Searchable by date
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 5. Observation Model - Asillah (Inspection Workflow)
class Observation(Base):
    __tablename__ = "Observation"
    
    observation_id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("Inspection.inspection_id"), nullable=False)  # FK to Inspection
    component = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    observation_type = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=True)
    status = Column(String(50), default="OPEN")
    priority = Column(String(50), default="MEDIUM")
    action_required = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 6. Finding Model - Asillah (Inspection Workflow)
class Finding(Base):
    __tablename__ = "Finding"
    
    finding_id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(Integer, ForeignKey("Observation.observation_id"), nullable=False)  # FK to Observation
    finding_key = Column(String(20), nullable=False)  # e.g., "1.1", "1.2", "2.1"
    finding_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 7. Recommendation Model - Asillah (Inspection Workflow)
class Recommendation(Base):
    __tablename__ = "Recommendation"
    
    recommendation_id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(Integer, ForeignKey("Observation.observation_id"), nullable=False)  # FK to Observation
    recommendation_key = Column(String(20), nullable=False)  # e.g., "1.1", "1.2", "2.1"
    recommendation_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 8. Finding Template Model - Dynamic Template Management
class FindingTemplate(Base):
    __tablename__ = "FindingTemplate"
    
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(255), nullable=False)  # Display label (e.g., "External - Coating condition")
    text = Column(Text, nullable=False)  # Template text
    created_by = Column(Integer, ForeignKey("User.id"), nullable=True)  # Who created the template
    is_active = Column(String(10), default="ACTIVE")  # ACTIVE or INACTIVE
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 9. Recommendation Template Model - Dynamic Template Management
class RecommendationTemplate(Base):
    __tablename__ = "RecommendationTemplate"
    
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(255), nullable=False)  # Display label (e.g., "Touch-up coating")
    text = Column(Text, nullable=False)  # Template text
    created_by = Column(Integer, ForeignKey("User.id"), nullable=True)  # Who created the template
    is_active = Column(String(10), default="ACTIVE")  # ACTIVE or INACTIVE
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

