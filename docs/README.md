# VISOR Documentation

## System Architecture

This folder contains system documentation for VISOR (Visual Inspection Report Automation).

### Contents

- **System Architecture Diagrams**: Overall system design and component relationships
- **Data Flow Diagrams**: How data flows through the system
- **Use Case Diagrams**: User interactions and system use cases
- **API Documentation**: Detailed API endpoint documentation
- **Module Assignments**: Team member module assignments and responsibilities

## Module Assignments

### Backend Modules

1. **Authentication & User Roles** - Haifa
   - `backend/app/routers/auth/`
   - `backend/app/routers/user_roles/`

2. **Photo Upload** - Asillah (Module 1)
   - `backend/app/routers/photo_upload/`

3. **Inspection Workflow** - Asillah (Module 2)
   - `backend/app/routers/inspection_workflow/`

4. **Image Processing (AI)** - Abdalla (Module 1)
   - `backend/app/routers/image_processing/`
   - `backend/app/ai_models/`

5. **Report Generation** - Abdalla (Module 2)
   - `backend/app/routers/report_generation/`

6. **Reporting Validation** - Jay (Module 1)
   - `backend/app/routers/reporting_validation/`

7. **Realtime Monitoring** - Jay (Module 2)
   - `backend/app/routers/realtime_monitoring/`

8. **Equipment Management** - Yi Jing (Module 1)
   - `backend/app/routers/equipment/`

9. **Analytics** - Yi Jing (Module 2)
   - `backend/app/routers/analytics/`

### Frontend Modules

Each backend module has a corresponding frontend module in `frontend/src/modules/`:

- `auth/` - Haifa
- `photoUpload/` - Asillah
- `inspection/` - Asillah
- `defectAI/` - Abdalla
- `reports/` - Abdalla
- `validation/` - Jay
- `monitoring/` - Jay
- `equipment/` - Yi Jing
- `analytics/` - Yi Jing

## Getting Started

See the main project README for setup instructions.

