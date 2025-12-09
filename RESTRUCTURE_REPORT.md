# VISOR Project Restructure Report

## Executive Summary

Restructured the VISOR project from a flat structure to a modular, team-based architecture. Separated backend and frontend, organized code by modules, and migrated existing authentication code to the new structure.

---

## What Was Done

### 1. **Created New Backend Structure** (`backend/app/`)

#### Core Application Files
- **`main.py`**: New FastAPI entry point (migrated from `backend/main.py`)
- **`config.py`**: Centralized configuration using Pydantic Settings
- **`dependencies.py`**: Shared FastAPI dependencies (JWT authentication, database sessions)

#### Database Layer (`backend/app/database/`)
- **`connection.py`**: Supabase connection (migrated from `backend/database.py`)
- **`models.py`**: SQLAlchemy models (new, structured version)
- **`schemas.py`**: Pydantic schemas for request/response validation (new)

#### Router Modules (`backend/app/routers/`)
Created 10 modular router folders, each containing:
- `routes_*.py`: API endpoint definitions
- `service_*.py`: Business logic
- `router.py`: Router export for main.py
- `__init__.py`: Package marker

#### Utilities (`backend/app/utils/`)
- **`jwt_utils.py`**: JWT token creation/verification (migrated from `backend/utils/jwt_utils.py`)
- **`email_utils.py`**: Email notification utilities (new)
- **`response_models.py`**: Standardized response formats (new)

#### Storage & AI
- **`storage/uploads/`**: Photo storage directory
- **`storage/reports/`**: Report storage directory
- **`ai_models/`**: TensorFlow Lite model and detector

### 2. **Created Frontend Structure** (`frontend/`)

- React + Vite setup with TailwindCSS
- Modular structure matching backend modules
- Routing system in `app/router.jsx`
- Service layer for API calls
- Component, assets, and styles folders

### 3. **Documentation & Environment**

- **`docs/`**: System documentation and module assignments
- **`environment/`**: Environment variable templates and setup guide

---

## Authentication Module - Detailed Changes

### Existing Files (Before Restructure)

#### 1. `backend/main.py` (168 lines)
**What it contained:**
- All authentication logic directly in main.py
- Login endpoint: `/api/login`
- User management endpoints: `/api/users`, `/api/users` (POST), `/api/users/{user_id}/status`
- Direct Supabase calls
- Inline Pydantic models (LoginRequest, UserCreate)

**Key Code:**
```python
@app.post("/api/login")
def login_user(data: LoginRequest):
    # Direct Supabase query
    res = supabase.table("User").select(...).eq("username", data.username).execute()
    # Password verification
    # Return user data without JWT token
```

#### 2. `backend/routers/auth_router.py` (41 lines)
**What it contained:**
- Basic router with `/register` and `/login` endpoints
- **In-memory database** (`users_db = {}`) - NOT using Supabase
- Simple JWT token generation
- No integration with actual database

**Key Code:**
```python
users_db = {}  # Temporary in-memory storage
@router.post("/login")
def login(user: User):
    if user.username not in users_db:  # Checking in-memory dict
        raise HTTPException(...)
```

#### 3. `backend/utils/jwt_utils.py` (Empty file)
- File existed but was empty

#### 4. `backend/utils/auth_utils.py` (Empty file)
- File existed but was empty

---

### New Files Created (After Restructure)

#### 1. `backend/app/routers/auth/routes_auth.py` (34 lines)
**What it does:**
- Defines API endpoints using FastAPI router
- Separates route definitions from business logic
- Uses dependency injection for authentication

**Endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info (protected)
- `POST /api/auth/logout` - User logout

**Key Changes:**
- Moved from inline endpoints in `main.py` to dedicated router
- Added `/me` and `/logout` endpoints
- Uses `AuthService` for business logic
- Uses Pydantic schemas from `database/schemas.py`

#### 2. `backend/app/routers/auth/service_auth.py` (92 lines)
**What it does:**
- Contains all authentication business logic
- Handles Supabase database operations
- Password hashing/verification
- JWT token generation

**Key Features:**
- **Migrated login logic** from `backend/main.py`:
  - Same Supabase query structure
  - Same password verification using bcrypt
  - Same account status checking
  - **Added JWT token generation** (was missing in original)
  
- **Migrated registration logic** from `backend/main.py`:
  - Same duplicate checking
  - Same password hashing
  - Same user creation flow

**Improvements:**
- Uses centralized database connection (`app.database.connection.get_db()`)
- Uses centralized JWT utilities (`app.utils.jwt_utils.create_access_token()`)
- Better error handling with proper exception propagation
- Returns structured `LoginResponse` and `UserResponse` models

#### 3. `backend/app/utils/jwt_utils.py` (New - 30 lines)
**What it does:**
- `create_access_token()`: Creates JWT tokens with expiration
- `verify_token()`: Verifies and decodes JWT tokens
- Uses settings from `config.py` for secret key and algorithm

**Key Features:**
- Configurable token expiration (from settings)
- Proper error handling for expired/invalid tokens
- Returns None for invalid tokens (safe failure)

#### 4. `backend/app/database/schemas.py` (New - Contains auth schemas)
**What it contains:**
- `LoginRequest`: Request model for login
- `LoginResponse`: Response model with token and user info
- `UserCreate`: Request model for registration
- `UserResponse`: Response model for user data

**Migration:**
- Moved `LoginRequest` and `UserCreate` from inline models in `main.py`
- Created proper response models (was returning dicts before)

#### 5. `backend/app/dependencies.py` (New)
**What it contains:**
- `get_current_user()`: Dependency for protected routes
- Uses JWT verification from `jwt_utils`
- Returns user payload from token

**Impact:**
- Enables route protection (e.g., `/api/auth/me`)
- Standardized authentication across all modules

---

## Migration Summary: Authentication

### Code Migration Path

| Old Location | New Location | Status |
|-------------|--------------|--------|
| `backend/main.py` (login logic) | `backend/app/routers/auth/service_auth.py` | ✅ Migrated & Enhanced |
| `backend/main.py` (user endpoints) | `backend/app/routers/user_roles/` | ✅ Separated into new module |
| `backend/routers/auth_router.py` | **NOT USED** - Was in-memory only | ❌ Replaced (not migrated) |
| `backend/utils/jwt_utils.py` (empty) | `backend/app/utils/jwt_utils.py` | ✅ Created new implementation |
| `backend/utils/auth_utils.py` (empty) | N/A | ❌ Not needed (logic in service) |

### Functional Changes

#### What Was Preserved:
1. ✅ Login endpoint functionality (same Supabase queries)
2. ✅ Password hashing with bcrypt
3. ✅ Account status checking
4. ✅ User registration flow
5. ✅ Duplicate username/email checking

#### What Was Added:
1. ✅ **JWT token generation** (was missing in original `main.py`)
2. ✅ **Token-based authentication** for protected routes
3. ✅ `/me` endpoint to get current user
4. ✅ `/logout` endpoint
5. ✅ Proper response models (Pydantic schemas)
6. ✅ Centralized configuration
7. ✅ Better error handling

#### What Was Removed:
1. ❌ In-memory database from `auth_router.py` (was not being used)
2. ❌ Direct Supabase imports in route files
3. ❌ Inline Pydantic models in main.py

---

## File Structure Comparison

### Before:
```
backend/
├── main.py (all auth logic here)
├── database.py
├── routers/
│   └── auth_router.py (in-memory, unused)
└── utils/
    ├── jwt_utils.py (empty)
    └── auth_utils.py (empty)
```

### After:
```
backend/app/
├── main.py (router registration only)
├── config.py
├── dependencies.py
├── database/
│   ├── connection.py (migrated from database.py)
│   ├── models.py
│   └── schemas.py (auth models here)
├── routers/
│   └── auth/
│       ├── routes_auth.py (endpoints)
│       ├── service_auth.py (business logic - migrated from main.py)
│       └── router.py (export)
└── utils/
    └── jwt_utils.py (new implementation)
```

---

## API Endpoint Changes

### Before:
- `POST /api/login` → Returns user data (no token)
- `GET /api/users` → Get all users
- `POST /api/users` → Create user
- `PATCH /api/users/{id}/status` → Toggle status

### After:
- `POST /api/auth/login` → Returns user data **+ JWT token** ✨
- `POST /api/auth/register` → Register new user
- `GET /api/auth/me` → Get current user (protected) ✨
- `POST /api/auth/logout` → Logout ✨
- `GET /api/users` → Get all users (moved to user_roles module)
- `POST /api/users` → Create user (moved to user_roles module)
- `PATCH /api/users/{id}/status` → Toggle status (moved to user_roles module)

---

## Key Improvements

1. **Separation of Concerns**: Routes, services, and utilities are now separate
2. **JWT Authentication**: Added proper token-based auth (was missing)
3. **Modularity**: Auth module is self-contained and reusable
4. **Type Safety**: Using Pydantic schemas for validation
5. **Configuration**: Centralized settings management
6. **Dependency Injection**: Using FastAPI dependencies for auth
7. **Code Reusability**: JWT utilities can be used by other modules

---

## Notes

- **Old files still exist**: `backend/main.py`, `backend/routers/auth_router.py` are still in the repository but are not used by the new structure
- **Backward compatibility**: The new auth endpoints follow similar patterns but return JWT tokens
- **Database**: Still uses Supabase (no change in database technology)
- **Password hashing**: Still uses bcrypt (no change in security approach)

---

## Next Steps for Team

1. Test the new authentication endpoints
2. Update frontend to use new `/api/auth/login` endpoint and handle JWT tokens
3. Remove old unused files (`backend/main.py`, `backend/routers/auth_router.py`) after verification
4. Update any existing API clients to use new endpoint paths

