# VISOR Frontend Structure

## 📁 Directory Structure

```
VISOR/frontend/
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
├── vite.config.js               # Vite configuration
└── src/
    ├── main.jsx                  # React entry point
    ├── app/
    │   ├── main.jsx             # App component (BrowserRouter wrapper)
    │   └── router.jsx           # Route definitions
    ├── modules/                  # Feature modules (one per team member)
    │   ├── auth/
    │   │   └── Login.jsx         # Authentication (Haifa)
    │   ├── photoUpload/
    │   │   └── PhotoUpload.jsx  # Photo upload module
    │   ├── inspection/
    │   │   └── Inspection.jsx   # Inspection workflow
    │   ├── defectAI/
    │   │   └── DefectAI.jsx     # AI defect detection
    │   ├── reports/
    │   │   └── Reports.jsx      # API-510 Report Generation (Abdalla)
    │   ├── validation/
    │   │   └── Validation.jsx   # Report validation
    │   ├── monitoring/
    │   │   └── Monitoring.jsx   # Real-time monitoring (Jay)
    │   ├── equipment/
    │   │   └── Equipment.jsx   # Equipment management
    │   └── analytics/
    │       └── Analytics.jsx    # Analytics dashboard
    ├── services/                 # API services
    │   ├── api.js               # API base URL configuration
    │   ├── authService.js       # Authentication API calls
    │   └── reportService.js     # Report generation API calls
    ├── styles/
    │   └── index.css            # Global styles (TailwindCSS)
    ├── components/              # Shared components (empty - can be used for reusable UI)
    └── assets/                  # Static assets (empty - can be used for images, etc.)
```

## 🛣️ Routes

All routes are defined in `src/app/router.jsx`:

- `/` → Redirects to `/login`
- `/login` → Authentication page
- `/photo-upload` → Photo upload module
- `/inspection` → Inspection workflow
- `/defect-ai` → AI defect detection
- `/reports` → API-510 Report Generation (Abdalla)
- `/validation` → Report validation
- `/monitoring` → Real-time monitoring dashboard
- `/equipment` → Equipment management
- `/analytics` → Analytics dashboard

## 📦 Key Files

### Entry Points
- **`index.html`** - HTML entry point, loads `main.jsx`
- **`src/main.jsx`** - React entry point, mounts App component
- **`src/app/main.jsx`** - App component, wraps Router with BrowserRouter

### Routing
- **`src/app/router.jsx`** - Defines all application routes

### Services
- **`src/services/api.js`** - API base URL: `http://127.0.0.1:8000/api`
- **`src/services/authService.js`** - Authentication API calls
- **`src/services/reportService.js`** - Report generation API calls

### Modules
Each module is self-contained in its own directory:
- **`src/modules/reports/Reports.jsx`** - Complete API-510 report generation UI

## 🧹 Cleanup Status

✅ **Removed:**
- Test files: `ReportsTest.jsx`, `ReportsStandalone.jsx`
- Backup files: `router.jsx.backup`
- Debug console logs from Reports component
- Debug UI banners

✅ **Cleaned:**
- Router restored with all proper routes
- Main entry points simplified
- No test/debug code remaining

## 🚀 Development

### Start Development Server
```bash
cd VISOR/frontend
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📝 Notes

- All modules follow the same structure pattern
- Services handle all API communication
- Router uses React Router v6.20.0
- Styling uses TailwindCSS
- No shared components yet (components/ directory is empty)


