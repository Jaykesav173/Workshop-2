import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app.routers.auth.router import router as auth_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VISOR API",
    description="Visual Inspection Report Automation System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only include the auth module
app.include_router(auth_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "VISOR API running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

