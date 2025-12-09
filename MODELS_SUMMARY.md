# VISOR Database Models Summary

## Overview
The database now contains **4 core models** corresponding to each team member's module.

---

## 1. User Model - Haifa (User Authentication)

**Purpose**: Stores user account information for authentication

**Fields**:
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `username` - Unique username for login
- `hashed_password` - Encrypted password
- `role` - User role (ADMIN, INSPECTOR, USER)
- `Account_status` - Account status (ACTIVE, INACTIVE)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

**Used by**: 
- Haifa's authentication module
- All modules (for user references)

---

## 2. Equipment Model - Yi Jing (Equipment Information)

**Purpose**: Stores equipment information and details

**Fields**:
- `id` - Primary key
- `name` - Equipment name
- `type` - Equipment type/category
- `location` - Where equipment is located
- `serial_number` - Unique serial number
- `status` - Equipment status (ACTIVE, INACTIVE, etc.)
- `created_at` - Creation timestamp

**Used by**: 
- Yi Jing's equipment management module
- Photo model (optional link)
- Report model (optional link)

---

## 3. Photo Model - Asillah (Photo Upload)

**Purpose**: Stores uploaded inspection photos

**Fields**:
- `id` - Primary key
- `equipment_id` - Optional link to equipment (ForeignKey)
- `uploaded_by` - User who uploaded (ForeignKey to User)
- `file_path` - Local file system path
- `storage_url` - Supabase storage URL
- `file_name` - Original filename
- `file_size` - File size in bytes
- `uploaded_at` - Upload timestamp

**Used by**: 
- Asillah's photo upload module

**Relationships**:
- Links to `User` (who uploaded)
- Optionally links to `Equipment` (what equipment it's for)

---

## 4. Report Model - Abdalla (Intelligent Report Generation)

**Purpose**: Stores generated inspection reports

**Fields**:
- `id` - Primary key
- `equipment_id` - Optional link to equipment (ForeignKey)
- `created_by` - User who created report (ForeignKey to User)
- `report_path` - Local file system path
- `report_url` - Supabase storage URL
- `report_type` - Type of report (default: "INSPECTION")
- `title` - Report title
- `content` - Report content/description (Text field)
- `status` - Report status (DRAFT, COMPLETED, ARCHIVED)
- `created_at` - Creation timestamp

**Used by**: 
- Abdalla's report generation module (creates reports)

**Relationships**:
- Links to `User` (who created the report)
- Optionally links to `Equipment` (what equipment report is for)

---

## Model Relationships

```
User
 ├── Photo (uploaded_by)
 ├── Report (created_by)
 └── Report (validator_id)

Equipment
 ├── Photo (equipment_id) - optional
 └── Report (equipment_id) - optional

Photo
 └── Links to User and optionally Equipment

Report
 └── Links to User (creator) and optionally Equipment
```

---

## Removed Models

The following models were removed to simplify the structure:
- ❌ **Inspection** - Removed (can be handled through Report model)
- ❌ **Defect** - Removed (can be included in Report content or as separate data)

---

## Schema Files

Each model has corresponding Pydantic schemas in `database/schemas.py`:
- Request schemas (for API input)
- Response schemas (for API output)
- Validation schemas (for data validation)

---

## Usage by Module

| Module | Owner | Primary Model(s) | Secondary Models |
|--------|-------|------------------|-------------------|
| Authentication | Haifa | User | - |
| Photo Upload | Asillah | Photo | User, Equipment |
| Equipment Info | Yi Jing | Equipment | - |
| Report Generation | Abdalla | Report | User, Equipment |

---

## Notes

- All models use SQLAlchemy ORM
- Foreign keys maintain referential integrity
- Timestamps are automatically managed
- Status fields allow for workflow management
- Optional fields (nullable=True) provide flexibility

