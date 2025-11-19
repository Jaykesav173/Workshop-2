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
class Equipment(Base):
    __tablename__ = "Equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    location = Column(String)
    serial_number = Column(String, unique=True)
    manufacturer = Column(String, nullable=True)  # Equipment manufacturer
    model_number = Column(String, nullable=True)  # Model number
    installation_date = Column(DateTime, nullable=True)  # When equipment was installed
    status = Column(String, default="ACTIVE")  # ACTIVE, INACTIVE, DECOMMISSIONED
    created_by = Column(Integer, ForeignKey("User.id"), nullable=True)  # Inspector who registered the equipment
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

