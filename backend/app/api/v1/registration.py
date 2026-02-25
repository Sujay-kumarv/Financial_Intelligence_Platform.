"""
Registration API Endpoints
Public registration + Admin approval/rejection
"""
import os
import secrets
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import User, RegistrationRequest
from app.schemas.schemas import RegistrationResponse, RegistrationAction
from app.utils.security import get_password_hash
from app.api.v1.permissions import is_admin
from app.services.email_service import send_credentials_email
from app.config import settings

router = APIRouter()

ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/jpg"}


def generate_secure_password(length: int = 12) -> str:
    """Generate a random secure password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    # Ensure at least one of each required type
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%&*"),
    ]
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=RegistrationResponse)
async def submit_registration(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    designation: str = Form(None),
    department: str = Form(None),
    date_of_joining: str = Form(None),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Public endpoint — submit a registration request.
    Requires a face photo. No authentication needed.
    """
    # Check for duplicate email in both users and pending registrations
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered."
        )

    existing_request = (
        db.query(RegistrationRequest)
        .filter(RegistrationRequest.email == email, RegistrationRequest.status == "pending")
        .first()
    )
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A registration request with this email is already pending."
        )

    # Validate photo type
    if photo.content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Photo must be a JPEG or PNG image."
        )

    # Read photo bytes
    photo_bytes = await photo.read()
    if len(photo_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Photo must be less than 5MB."
        )

    # Validate face in photo
    try:
        from app.services.face_validator import validate_face_photo
        validate_face_photo(photo_bytes)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Save photo to disk
    os.makedirs(settings.PHOTO_UPLOAD_DIR, exist_ok=True)
    photo_ext = photo.filename.rsplit(".", 1)[-1] if "." in photo.filename else "jpg"
    photo_filename = f"reg_{secrets.token_hex(8)}.{photo_ext}"
    photo_path = os.path.join(settings.PHOTO_UPLOAD_DIR, photo_filename)

    with open(photo_path, "wb") as f:
        f.write(photo_bytes)

    # Parse date_of_joining if provided
    parsed_doj = None
    if date_of_joining:
        try:
            parsed_doj = datetime.strptime(date_of_joining, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="date_of_joining must be in YYYY-MM-DD format."
            )

    # Create registration request
    reg = RegistrationRequest(
        full_name=full_name.strip(),
        email=email.strip().lower(),
        phone=phone.strip(),
        photo_path=photo_path,
        date_of_joining=parsed_doj,
        designation=designation.strip() if designation else None,
        department=department.strip() if department else None,
        status="pending",
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)

    return reg


@router.get("/registrations", response_model=List[RegistrationResponse])
async def list_registrations(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin),
):
    """List all registration requests (Admin Only)."""
    query = db.query(RegistrationRequest).order_by(RegistrationRequest.created_at.desc())
    if status_filter and status_filter in ("pending", "approved", "rejected"):
        query = query.filter(RegistrationRequest.status == status_filter)
    return query.all()


@router.post("/registrations/{reg_id}/approve", response_model=RegistrationResponse)
async def approve_registration(
    reg_id: str,
    action: RegistrationAction = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin),
):
    """
    Approve a registration request (Admin Only).
    Creates a user account, generates a password, and sends credentials via email.
    """
    reg = db.query(RegistrationRequest).filter(RegistrationRequest.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration request not found.")
    if reg.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This request has already been {reg.status}."
        )

    # Check email isn't already taken (edge case)
    existing = db.query(User).filter(User.email == reg.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Generate secure password
    raw_password = generate_secure_password()

    # Create user account
    new_user = User(
        email=reg.email,
        hashed_password=get_password_hash(raw_password),
        full_name=reg.full_name,
        phone=reg.phone,
        photo_path=reg.photo_path,
        designation=reg.designation,
        department=reg.department,
        date_of_joining=reg.date_of_joining,
        role="analyst",
        is_active=True,
    )
    db.add(new_user)

    # Update registration status
    reg.status = "approved"
    reg.reviewed_by = current_user.id
    reg.reviewed_at = datetime.utcnow()
    if action and action.admin_notes:
        reg.admin_notes = action.admin_notes

    db.commit()
    db.refresh(reg)

    # Send credentials email (non-blocking — don't fail the request if email fails)
    send_credentials_email(reg.email, reg.full_name, raw_password)

    # Attach temp_password so admin can see/copy it
    reg.temp_password = raw_password
    return reg


@router.post("/registrations/{reg_id}/reject", response_model=RegistrationResponse)
async def reject_registration(
    reg_id: str,
    action: RegistrationAction = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin),
):
    """Reject a registration request (Admin Only)."""
    reg = db.query(RegistrationRequest).filter(RegistrationRequest.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration request not found.")
    if reg.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This request has already been {reg.status}."
        )

    reg.status = "rejected"
    reg.reviewed_by = current_user.id
    reg.reviewed_at = datetime.utcnow()
    if action and action.admin_notes:
        reg.admin_notes = action.admin_notes

    db.commit()
    db.refresh(reg)

    return reg

@router.post("/registrations/{reg_id}/resend-email", response_model=RegistrationResponse)
async def resend_registration_email(
    reg_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin),
):
    """
    Resend credentials email for an approved registration.
    Generates a NEW password, updates the user account, and sends email.
    """
    reg = db.query(RegistrationRequest).filter(RegistrationRequest.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration request not found.")
    
    if reg.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only resend credentials for approved registrations."
        )

    # Find the corresponding user
    user = db.query(User).filter(User.email == reg.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found for this registration.")

    # Generate NEW secure password
    new_raw_password = generate_secure_password()

    # Update user password
    user.hashed_password = get_password_hash(new_raw_password)
    
    db.commit()
    db.refresh(reg)

    # Send credentials email (non-blocking)
    send_credentials_email(reg.email, reg.full_name, new_raw_password)

    # Attach temp_password to response so admin can see/copy it
    reg.temp_password = new_raw_password
    return reg
