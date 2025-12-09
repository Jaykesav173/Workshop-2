# VISOR Project Structure - Complete Explanation

## 📁 Root Level

### `VISOR/` (Project Root)
The main project folder containing everything.

---

## 🔵 Backend Structure

### `backend/` 
**Purpose**: Contains all backend/server-side code (FastAPI Python application)

#### `backend/app/`
**Purpose**: The main application package - all your FastAPI code lives here

**Why `app/`?**: 
- Keeps application code separate from configuration files
- Standard FastAPI project structure
- Makes imports cleaner: `from app.database import ...`

---

### `backend/app/main.py`
**Purpose**: FastAPI application entry point - the "startup file"

**What it does**:
- Creates the FastAPI app instance
- Configures CORS (Cross-Origin Resource Sharing)
- Registers all router modules
- Defines root endpoints (`/`, `/health`)

**When you run**: `uvicorn app.main:app --reload`
- This file is what starts your server

---

### `backend/app/config.py`
**Purpose**: Centralized configuration management

**What it does**:
- Loads environment variables from `.env` file
- Defines all app settings (database URLs, JWT secrets, etc.)
- Provides a `Settings` class that other files import
- Validates that required settings exist

**Why separate?**: 
- One place to manage all configuration
- Easy to change settings without touching code
- Type-safe with Pydantic

**Example**: Other files do `from app.config import settings` then use `settings.SUPABASE_URL`

---

### `backend/app/dependencies.py`
**Purpose**: Shared FastAPI dependencies (reusable across routes)

**What it contains**:
- `get_current_user()`: Dependency that verifies JWT tokens
- `get_db_session()`: Dependency that provides database connection

**How it works**:
```python
@router.get("/protected")
async def my_route(current_user: dict = Depends(get_current_user)):
    # current_user is automatically injected if token is valid
```

**Why separate?**: 
- Reusable authentication logic
- Don't repeat code in every route
- Easy to modify auth behavior in one place

---

### `backend/app/database/`
**Purpose**: Database layer - everything related to data storage

#### `database/connection.py`
**Purpose**: Database connection setup

**What it does**:
- Creates Supabase client connection
- Exports `get_db()` function that returns the database client
- Tests connection on import

**Why separate?**: 
- Single place to manage database connection
- Easy to switch databases later
- Reusable across all modules

#### `database/models.py`
**Purpose**: SQLAlchemy ORM models (database table definitions)

**What it contains**:
- Python classes representing database tables
- Defines table structure (columns, types, relationships)
- Examples: `User`, `Equipment`, `Inspection`, `Photo`, `Defect`, `Report`

**Why needed?**: 
- Maps Python objects to database tables
- Type-safe database operations
- Defines relationships between tables

**Example**:
```python
class User(Base):
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    # ... represents the "User" table in database
```

#### `database/schemas.py`
**Purpose**: Pydantic models for request/response validation

**What it contains**:
- Request models (what API expects): `LoginRequest`, `UserCreate`
- Response models (what API returns): `UserResponse`, `LoginResponse`
- Data validation rules

**Why separate from models?**: 
- **models.py** = Database structure (how data is stored)
- **schemas.py** = API structure (how data is sent/received)
- Allows different formats for API vs database

**Example**:
- Database might store `hashed_password`
- API response never includes password (security)
- Schemas control what gets exposed

---

### `backend/app/routers/`
**Purpose**: Contains all API route modules (organized by feature/team member)

**Structure**: Each module is a folder with 3 files

#### Why modular?
- Each team member works on their own module
- No code conflicts
- Easy to find code by feature
- Clear ownership

---

### `backend/app/routers/auth/` (Haifa's Module)
**Purpose**: Authentication endpoints

#### `routes_auth.py`
**Purpose**: Defines API endpoints (URLs and HTTP methods)

**What it does**:
- Defines routes like `POST /api/auth/login`
- Handles HTTP requests/responses
- Calls service layer for business logic
- Uses FastAPI decorators: `@router.post("/login")`

**Why separate from service?**: 
- Routes = "What endpoints exist"
- Service = "How they work"
- Separation of concerns

**Example**:
```python
@router.post("/login")
async def login(credentials: LoginRequest):
    return await auth_service.login(credentials)  # Calls service
```

#### `service_auth.py`
**Purpose**: Business logic for authentication

**What it does**:
- Contains actual login/registration logic
- Queries database
- Validates passwords
- Creates JWT tokens
- Handles errors

**Why separate from routes?**: 
- Routes = HTTP layer (request/response)
- Service = Business logic (what actually happens)
- Can be tested independently
- Can be reused by other routes

**Example**:
```python
async def login(self, credentials):
    # Query database
    # Check password
    # Create token
    # Return result
```

#### `router.py`
**Purpose**: Exports the router for main.py

**What it does**:
- Imports router from `routes_auth.py`
- Exports it so `main.py` can include it

**Why needed?**: 
- Clean imports in main.py
- `from app.routers.auth.router import router`

---

### `backend/app/routers/user_roles/` (Haifa's Module)
**Purpose**: User management and role assignment

**Same structure**: `routes_user_roles.py`, `service_user_roles.py`, `router.py`

**What it does**:
- Get all users
- Update user roles
- Toggle user status (ACTIVE/INACTIVE)

---

### `backend/app/routers/photo_upload/` (Asillah - Module 1)
**Purpose**: Handle photo uploads for inspections

**What it does**:
- Upload photos to storage
- Save photo metadata to database
- Retrieve/delete photos

---

### `backend/app/routers/inspection_workflow/` (Asillah - Module 2)
**Purpose**: Manage inspection workflow

**What it does**:
- Create inspections
- Update inspection status
- Track inspection progress

---

### `backend/app/routers/image_processing/` (Abdalla - Module 1)
**Purpose**: AI-powered defect detection

**What it does**:
- Run TensorFlow Lite model on photos
- Detect defects in images
- Save detection results

---

### `backend/app/routers/report_generation/` (Abdalla - Module 2)
**Purpose**: Generate inspection reports

**What it does**:
- Create PDF/JSON reports
- Combine inspection data
- Save reports to storage

---

### `backend/app/routers/reporting_validation/` (Jay - Module 1)
**Purpose**: QA approval workflow

**What it does**:
- Approve/reject reports
- Track validation status
- Maintain validation history

---

### `backend/app/routers/realtime_monitoring/` (Jay - Module 2)
**Purpose**: Real-time status dashboard

**What it does**:
- Get dashboard statistics
- Monitor inspection statuses
- Track system alerts

---

### `backend/app/routers/equipment/` (Yi Jing - Module 1)
**Purpose**: Equipment information management

**What it does**:
- CRUD operations for equipment
- Track equipment details
- Manage equipment status

---

### `backend/app/routers/analytics/` (Yi Jing - Module 2)
**Purpose**: Analytics and insights

**What it does**:
- Generate historical insights
- Provide recommendations
- Show trends and statistics

---

### `backend/app/utils/`
**Purpose**: Reusable utility functions

#### `jwt_utils.py`
**Purpose**: JWT token operations

**What it does**:
- `create_access_token()`: Generate JWT tokens
- `verify_token()`: Validate and decode tokens

**Why separate?**: 
- Used by multiple modules
- Centralized token logic
- Easy to update token algorithm

#### `email_utils.py`
**Purpose**: Email notification functions

**What it does**:
- `send_email()`: Send email notifications
- Configured with SMTP settings

**Why separate?**: 
- Reusable across modules
- Can send emails for any event

#### `response_models.py`
**Purpose**: Standardized API response formats

**What it contains**:
- `StandardResponse`: Success responses
- `ErrorResponse`: Error responses

**Why needed?**: 
- Consistent API responses
- Easy to format errors
- Type-safe responses

---

### `backend/app/storage/`
**Purpose**: File storage directories

#### `storage/uploads/`
**Purpose**: Store uploaded inspection photos

**What it does**:
- Physical storage for photo files
- Organized by upload date/user

#### `storage/reports/`
**Purpose**: Store generated reports

**What it does**:
- Physical storage for PDF/JSON reports
- Organized by report ID

**Why separate folders?**: 
- Different file types
- Easy to manage/backup
- Clear organization

---

### `backend/app/ai_models/`
**Purpose**: AI model files and detection code

#### `ai_models/model.tflite`
**Purpose**: TensorFlow Lite model file

**What it is**:
- Pre-trained AI model for defect detection
- Binary file (not code)
- Loaded by detector.py

#### `ai_models/detector.py`
**Purpose**: AI detection logic

**What it does**:
- Loads TensorFlow Lite model
- Processes images with OpenCV
- Detects defects in photos
- Returns detection results

**Why separate?**: 
- Isolated AI logic
- Easy to update model
- Can be tested independently

---

### `backend/requirements.txt`
**Purpose**: Python package dependencies

**What it contains**:
- List of all Python packages needed
- Version specifications

**Why needed?**: 
- `pip install -r requirements.txt` installs everything
- Ensures everyone has same packages
- Version control for dependencies

---

## 🟩 Frontend Structure

### `frontend/`
**Purpose**: React + Vite frontend application

---

### `frontend/src/`
**Purpose**: Source code for frontend

---

### `frontend/src/app/`
**Purpose**: Core application setup

#### `app/main.jsx`
**Purpose**: Main React component

**What it does**:
- Wraps app with BrowserRouter
- Renders the Router component
- Entry point for React app

#### `app/router.jsx`
**Purpose**: Defines all application routes

**What it does**:
- Maps URLs to React components
- Example: `/login` → `<AuthModule />`
- Uses React Router

**Why separate?**: 
- Centralized routing
- Easy to see all pages
- Easy to add new routes

---

### `frontend/src/modules/`
**Purpose**: Feature modules (one per team member/backend module)

**Structure**: Each module is a folder with React components

#### `modules/auth/` (Haifa)
**Purpose**: Authentication UI

**Contains**: `Login.jsx` - Login form component

#### `modules/photoUpload/` (Asillah)
**Purpose**: Photo upload UI

**Contains**: `PhotoUpload.jsx` - Upload interface

#### `modules/inspection/` (Asillah)
**Purpose**: Inspection workflow UI

**Contains**: `Inspection.jsx` - Inspection management

#### `modules/defectAI/` (Abdalla)
**Purpose**: AI defect detection UI

**Contains**: `DefectAI.jsx` - Detection interface

#### `modules/reports/` (Abdalla)
**Purpose**: Report generation UI

**Contains**: `Reports.jsx` - Report viewer/creator

#### `modules/validation/` (Jay)
**Purpose**: Validation/QA UI

**Contains**: `Validation.jsx` - Approval interface

#### `modules/monitoring/` (Jay)
**Purpose**: Monitoring dashboard UI

**Contains**: `Monitoring.jsx` - Dashboard component

#### `modules/equipment/` (Yi Jing)
**Purpose**: Equipment management UI

**Contains**: `Equipment.jsx` - Equipment interface

#### `modules/analytics/` (Yi Jing)
**Purpose**: Analytics dashboard UI

**Contains**: `Analytics.jsx` - Analytics charts/insights

---

### `frontend/src/services/`
**Purpose**: API service functions

#### `services/authService.js`
**Purpose**: Authentication API calls

**What it does**:
- `login()`: Calls `/api/auth/login`
- `register()`: Calls `/api/auth/register`
- Uses Axios for HTTP requests

**Why separate?**: 
- Reusable API calls
- Centralized API logic
- Easy to update endpoints

**Example**:
```javascript
authService.login(username, password)
  .then(response => {
    // Handle login
  })
```

---

### `frontend/src/components/`
**Purpose**: Reusable React components

**What goes here**:
- Buttons, forms, cards, modals
- Components used by multiple modules
- Shared UI elements

**Why separate?**: 
- Don't repeat code
- Consistent UI
- Easy to update design

---

### `frontend/src/assets/`
**Purpose**: Static files (images, icons, fonts)

**What goes here**:
- Logo images
- Icons
- Background images
- Font files

---

### `frontend/src/styles/`
**Purpose**: Global styles

#### `styles/index.css`
**Purpose**: Main stylesheet

**What it contains**:
- TailwindCSS imports
- Global CSS rules
- Base styles

---

### `frontend/package.json`
**Purpose**: Frontend dependencies and scripts

**What it contains**:
- List of npm packages
- Scripts: `npm run dev`, `npm run build`

---

### `frontend/vite.config.js`
**Purpose**: Vite build tool configuration

**What it does**:
- Configures development server
- Sets up proxy for API calls
- Configures build settings

---

### `frontend/tailwind.config.js`
**Purpose**: TailwindCSS configuration

**What it does**:
- Configures TailwindCSS
- Defines custom theme
- Sets up content paths

---

## 📚 Documentation

### `docs/`
**Purpose**: Project documentation

#### `docs/README.md`
**Purpose**: System overview and architecture

**What it contains**:
- System description
- Architecture diagrams (when added)
- Getting started guide

#### `docs/MODULE_ASSIGNMENTS.md`
**Purpose**: Team member responsibilities

**What it contains**:
- Who works on which module
- Module descriptions
- Development guidelines

---

## 🔧 Environment

### `environment/`
**Purpose**: Environment configuration templates

#### `environment/example.env`
**Purpose**: Template for environment variables

**What it contains**:
- Placeholder values for all settings
- Comments explaining each variable
- Copy this to `.env` and fill in real values

#### `environment/README.md`
**Purpose**: Environment setup instructions

**What it contains**:
- How to set up `.env` file
- What each variable does
- Security notes

**Why separate folder?**: 
- Template doesn't contain secrets
- Can be committed to git
- Clear setup instructions

---

## 📄 Root Files

### `README.md`
**Purpose**: Main project documentation

**What it contains**:
- Project overview
- Setup instructions
- Technology stack
- Quick start guide

---

### `RESTRUCTURE_REPORT.md`
**Purpose**: Documentation of the restructure process

**What it contains**:
- What changed
- Migration details
- Before/after comparisons

---

## 🔄 How It All Works Together

### Request Flow Example (Login):

1. **Frontend** (`modules/auth/Login.jsx`)
   - User enters credentials
   - Calls `authService.login()`

2. **Service** (`services/authService.js`)
   - Makes HTTP request to `/api/auth/login`

3. **Backend Route** (`routers/auth/routes_auth.py`)
   - Receives request at `POST /api/auth/login`
   - Calls `auth_service.login()`

4. **Service Logic** (`routers/auth/service_auth.py`)
   - Queries database via `database/connection.py`
   - Validates password
   - Creates JWT token via `utils/jwt_utils.py`
   - Returns response

5. **Response**
   - Goes back through layers
   - Frontend receives token
   - Stores token for future requests

---

## 🎯 Key Principles

### Separation of Concerns
- **Routes** = HTTP layer
- **Services** = Business logic
- **Database** = Data access
- **Utils** = Reusable functions

### Modularity
- Each feature in its own folder
- Team members don't conflict
- Easy to find code

### Reusability
- Utils shared across modules
- Components shared in frontend
- Services can be reused

### Maintainability
- Clear structure
- Easy to add features
- Easy to debug

---

This structure allows your team to work in parallel without conflicts, with clear ownership of each module!

