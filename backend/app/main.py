"""
Main FastAPI Application
Entry point for the Financial Intelligence Platform API
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
from pathlib import Path

from app.config import settings
from app.api.v1 import auth, chat, upload, analysis, companies, health, users, registration

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Financial Co-Pilot by Sujay Kumar AI Studio - Enterprise Financial Intelligence",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

print(f"CORS Allowed Origins: {settings.allowed_origins_list}")

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware
# Maximum permissiveness for connectivity resolution
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    origin = request.headers.get("origin")
    method = request.method
    url = str(request.url)
    print(f"Incoming Request: {method} {url} | Origin: {origin}")
    response = await call_next(request)
    return response

# Request timing header
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(companies.router, prefix="/api/v1", tags=["Companies"])
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(analysis.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(registration.router, prefix="/api/v1", tags=["Registration"])

# Serve uploaded photos as static files
from pathlib import Path as PathlibPath
photos_path = PathlibPath(settings.PHOTO_UPLOAD_DIR)
if photos_path.exists():
    app.mount("/uploads/photos", StaticFiles(directory=str(photos_path)), name="photos")

# Mount frontend static files
frontend_path = Path(__file__).parent.parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")

# Root API endpoint (only accessible if frontend not mounted)
@app.get("/api")
async def root():
    return {
        "message": "Financial Co-Pilot by Sujay Kumar AI Studio API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs" if settings.DEBUG else "disabled",
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8005,
        reload=settings.DEBUG
    )

