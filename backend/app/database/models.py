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
from sqlalchemy.orm import relationship
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
class Type(Base):
    __tablename__ = "type"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)

    equipments = relationship("Equipment", back_populates="type")

class Material(Base):
    __tablename__ = "material"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)

    equipments = relationship("Equipment", back_populates="material")

class Equipment(Base):
    __tablename__ = "Equipment"
    id = Column(Integer, primary_key=True, index=True)
    equipment_tag_no = Column(String, nullable=False, index=True)
    equipment_description = Column(String, nullable=False)
    type_id = Column(Integer, ForeignKey("Type.id"), nullable=False)
    # material = Column(String, nullable=True) # DEPRECATED
    material_id = Column(Integer, ForeignKey("material.id"), nullable=True) # New FK
    location = Column(String, nullable=True)
    inspection_due_date = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("User.id"), nullable=True)  # optional link to who created
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    dosh_registration_no = Column(String, nullable=True)
    nominal_thickness = Column(String, nullable=True)      # kept as string to allow decimals + units
    corrosion_allowance = Column(String, nullable=True)
    design_pressure = Column(String, nullable=True)
    design_temperature = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")  # ACTIVE, INACTIVE, MAINTENANCE

    # relationships
    type = relationship("Type", back_populates="equipments")
    material = relationship("Material", back_populates="equipments")
    creator = relationship("User", back_populates="equipment_created")
    photos = relationship("Photo", back_populates="equipment", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="equipment")
    
# 3. Photo Model - Asillah (Photo Upload)
class Photo(Base):
    __tablename__ = "Photo"
    
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("Equipment.id"), nullable=True)  # Optional link to equipment
    uploaded_by = Column(Integer, ForeignKey("User.id"), nullable=False)  # Who uploaded the photo
    file_path = Column(String, nullable=False)
    storage_url = Column(String) 
    file_name = Column(String)
    file_size = Column(Integer) 
    part_view = Column(String, nullable=True)  # e.g., "Front View", "Nameplate", "General View"
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

