"""
Health Check Endpoint
Simple endpoint to verify API is running
"""
from fastapi import APIRouter
from datetime import datetime

from app.services.llm_service import groq_service

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Financial Co-Pilot API",
        "groq_status": "enabled" if groq_service.enabled else "disabled (check GROQ_API_KEY)"
    }


@router.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Financial Co-Pilot by Sujay Kumar AI Studio API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }
