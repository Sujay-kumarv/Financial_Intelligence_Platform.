"""
Authentication Endpoints
Login only — user creation is handled via admin user management
"""
from datetime import datetime, timedelta
import secrets

from app.db.database import get_db
from app.db.models import User
from app.schemas.schemas import Token, ForgotPasswordRequest, ResetPasswordConfirm
from app.utils.security import verify_password, create_access_token, create_refresh_token, get_password_hash
from app.services.email_service import send_password_reset_email
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login and get access token
    OAuth2 compatible - accepts form data with username (email) and password
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    refresh_token = create_refresh_token(data={"sub": user.email, "user_id": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request password reset link
    """
    user = db.query(User).filter(User.email == request.email).first()
    
    # We always return success for security (don't reveal if email exists)
    if not user:
        return {"message": "If your email is registered, you will receive a reset link shortly."}
    
    # Generate token
    token = secrets.token_urlsafe(32)
    user.reset_password_token = token
    user.reset_password_expires = datetime.utcnow() + timedelta(hours=1)
    
    db.commit()
    
    # Send email
    send_password_reset_email(user.email, user.full_name, token)
    
    return {"message": "If your email is registered, you will receive a reset link shortly."}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordConfirm, db: Session = Depends(get_db)):
    """
    Confirm password reset using token
    """
    user = db.query(User).filter(
        User.reset_password_token == request.token,
        User.reset_password_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Reset password
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_password_token = None
    user.reset_password_expires = None
    
    db.commit()
    
    return {"message": "Password reset successfully. You can now login with your new password."}
