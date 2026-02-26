"""
User Management Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import User
from app.schemas.schemas import UserResponse, UserRegister, UserUpdate, UserProfileUpdate
from app.utils.security import get_password_hash
from app.api.v1.auth_deps import get_current_user_from_token
from app.api.v1.permissions import is_admin

router = APIRouter(prefix="/users")

VALID_ROLES = {"admin", "manager", "analyst", "readonly"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(get_current_user_from_token)):
    """
    Get current authenticated user information
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """
    Update current authenticated user's profile
    """
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    if profile_data.designation is not None:
        current_user.designation = profile_data.designation
    if profile_data.department is not None:
        current_user.department = profile_data.department
    if profile_data.date_of_joining is not None:
        current_user.date_of_joining = profile_data.date_of_joining
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("", response_model=List[UserResponse])
@router.get("/", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    """List all users (Admin Only)"""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    """Create a new user account (Admin Only)"""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role
    role = (user_data.role or "readonly").lower()
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}"
        )
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    """Update a user's role, name, or status (Admin Only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.role is not None:
        role = user_data.role.lower()
        if role not in VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}"
            )
        # Prevent removing last admin
        if user.role == "admin" and role != "admin":
            admin_count = db.query(User).filter(User.role == "admin").count()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last admin"
                )
        user.role = role
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    if user_data.phone is not None:
        user.phone = user_data.phone
    if user_data.designation is not None:
        user.designation = user_data.designation
    if user_data.department is not None:
        user.department = user_data.department
    if user_data.date_of_joining is not None:
        user.date_of_joining = user_data.date_of_joining
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    """Delete a user (Admin Only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db.delete(user)
    db.commit()
    return None

