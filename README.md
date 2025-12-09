# VISOR - Visual Inspection Report Automation

A comprehensive system for automating visual inspection reports using AI-powered defect detection.

## Project Structure

```
VISOR/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application entry point
│   │   ├── config.py       # Configuration settings
│   │   ├── dependencies.py # Shared dependencies
│   │   ├── database/       # Database layer
│   │   │   ├── connection.py
│   │   │   ├── models.py   # SQLAlchemy models
│   │   │   └── schemas.py  # Pydantic schemas
│   │   ├── routers/        # API routers (modular)
│   │   │   ├── auth/       # Haifa - Authentication
│   │   │   ├── user_roles/ # Haifa - User management
│   │   │   ├── photo_upload/        # Asillah (Module 1)
│   │   │   ├── inspection_workflow/ # Asillah (Module 2)
│   │   │   ├── image_processing/     # Abdalla (Module 1, AI)
│   │   │   ├── report_generation/   # Abdalla (Module 2)
│   │   │   ├── reporting_validation/ # Jay (Module 1)
│   │   │   ├── realtime_monitoring/  # Jay (Module 2)
│   │   │   ├── equipment/           # Yi Jing (Module 1)
│   │   │   └── analytics/           # Yi Jing (Module 2)
│   │   ├── ai_models/      # AI model files
│   │   │   ├── model.tflite
│   │   │   └── detector.py
│   │   ├── storage/        # File storage
│   │   │   ├── uploads/    # Uploaded photos
│   │   │   └── reports/    # Generated reports
│   │   └── utils/          # Utilities
│   │       ├── jwt_utils.py
│   │       ├── email_utils.py
│   │       └── response_models.py
│   └── requirements.txt
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── app/           # App core
│   │   │   ├── main.jsx
│   │   │   └── router.jsx
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/
│   │   │   ├── photoUpload/
│   │   │   ├── inspection/
│   │   │   ├── defectAI/
│   │   │   ├── reports/
│   │   │   ├── validation/
│   │   │   ├── monitoring/
│   │   │   ├── equipment/
│   │   │   └── analytics/
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API services
│   │   ├── assets/        # Static assets
│   │   └── styles/        # TailwindCSS styles
│   └── package.json
├── docs/                  # Documentation
│   ├── README.md
│   └── MODULE_ASSIGNMENTS.md
└── environment/           # Environment configuration
    ├── example.env
    └── README.md
```

## Technology Stack

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - Database (via Supabase)
- **Supabase** - Backend-as-a-Service
- **TensorFlow Lite** - AI model inference
- **OpenCV** - Image processing
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **React Router** - Routing

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd VISOR/backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Copy example.env to app/.env
cp ../environment/example.env app/.env
# Edit app/.env with your Supabase credentials
```

5. Run the server:
```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd VISOR/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
VITE_API_URL=http://localhost:8000
```

4. Run development server:
```bash
npm run dev
```

## Module Assignments

See `docs/MODULE_ASSIGNMENTS.md` for detailed team member responsibilities.

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development Guidelines

1. Each module is self-contained in its own folder
2. Follow the `routes_*.py` and `service_*.py` pattern for backend modules
3. Keep frontend modules in `frontend/src/modules/`
4. Update documentation when making significant changes

## License

[Your License Here]

