"""
Companies Endpoints
CRUD operations for companies — Admin-only for create/edit/delete
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
import shutil

from app.db.database import get_db
from app.db.models import Company
from app.schemas.schemas import CompanyCreate, CompanyResponse, CompanyUpdate
from app.api.v1.permissions import is_admin
from app.api.v1.auth_deps import get_current_user_from_token
from app.db.models import User
from app.config import settings

router = APIRouter(prefix="/companies")


class ApiConnectionRequest(BaseModel):
    name: str
    industry: Optional[str] = None
    ticker_symbol: Optional[str] = None
    fiscal_year_end: Optional[str] = "December"
    region: Optional[str] = None
    api_url: str
    api_key: Optional[str] = None
    endpoint_path: Optional[str] = None


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    """Create a new company (Admin Only)"""
    new_company = Company(
        name=company_data.name,
        industry=company_data.industry,
        ticker_symbol=company_data.ticker_symbol,
        fiscal_year_end=company_data.fiscal_year_end,
        region=company_data.region,
        data_source=company_data.data_source,
        company_metadata=company_data.metadata or {},
        created_by=current_user.id
    )
    
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    
    return new_company


@router.get("", response_model=List[CompanyResponse])
@router.get("/", response_model=List[CompanyResponse])
async def list_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """List all companies (Any authenticated user)"""
    companies = db.query(Company).all()
    return companies


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get a specific company (Any authenticated user)"""
    company = db.query(Company).filter(Company.id == company_id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return company


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    """Update a company (Admin Only)"""
    company = db.query(Company).filter(Company.id == company_id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_fields = company_data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        if field == "metadata":
            setattr(company, "company_metadata", value or {})
        else:
            setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    """Delete a company (Admin Only)"""
    company = db.query(Company).filter(Company.id == company_id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db.delete(company)
    db.commit()
    
    return None


@router.post("/upload-excel", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def upload_company_excel(
    file: UploadFile = File(...),
    name: str = Form(...),
    industry: str = Form(""),
    ticker_symbol: str = Form(""),
    fiscal_year_end: str = Form("December"),
    region: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    """Upload an Excel file and create a company record (Admin Only)"""
    # Validate file type
    allowed_extensions = ['.xlsx', '.xls', '.csv']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size (5MB max)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    await file.seek(0)
    
    # Save the file
    upload_dir = getattr(settings, 'UPLOAD_DIR', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create company record
    new_company = Company(
        name=name,
        industry=industry or None,
        ticker_symbol=ticker_symbol or None,
        fiscal_year_end=fiscal_year_end or "December",
        region=region or None,
        data_source="excel",
        company_metadata={"file_path": file_path, "file_name": file.filename},
        created_by=current_user.id
    )
    
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    
    return new_company


@router.post("/connect-api", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def connect_company_api(
    config: ApiConnectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_admin)
):
    """Create a company with an API data source connection (Admin Only)"""
    if not config.name.strip():
        raise HTTPException(status_code=400, detail="Company name is required")
    if not config.api_url.strip():
        raise HTTPException(status_code=400, detail="API URL is required")
    
    # Create company record with API config stored in metadata
    new_company = Company(
        name=config.name,
        industry=config.industry or None,
        ticker_symbol=config.ticker_symbol or None,
        fiscal_year_end=config.fiscal_year_end or "December",
        region=config.region or None,
        data_source="api",
        company_metadata={
            "api_url": config.api_url,
            "api_key_set": bool(config.api_key),  # Don't store the key in plain text in metadata
            "endpoint_path": config.endpoint_path or ""
        },
        created_by=current_user.id
    )
    
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    
    return new_company
