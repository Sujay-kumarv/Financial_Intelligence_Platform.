"""
Health Check Endpoint
Simple endpoint to verify API is running
"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Financial Co-Pilot by Sujay Kumar AI Studio API"
    }


@router.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Financial Co-Pilot by Sujay Kumar AI Studio API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }
