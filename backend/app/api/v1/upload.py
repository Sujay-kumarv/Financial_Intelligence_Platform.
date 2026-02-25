"""
Statement Upload Endpoints
Upload and parse financial statements
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import date
import os
import shutil

from app.db.database import get_db
from app.db.models import FinancialStatement, User
from app.schemas.schemas import StatementResponse
from app.core.parsers.excel_parser import parse_statement_file
from app.config import settings
from app.api.v1.auth_deps import get_current_user_from_token

router = APIRouter(prefix="/upload")


@router.post("", response_model=StatementResponse)
@router.post("/", response_model=StatementResponse)
async def upload_statement(
    file: UploadFile = File(...),
    company_id: str = Form(...),
    statement_type: str = Form(...),
    period_start: str = Form(...),
    period_end: str = Form(...),
    fiscal_year: int = Form(None),
    fiscal_quarter: int = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """
    Upload and parse a financial statement file
    Supports Excel (.xlsx, .xls) and CSV (.csv)
    """
    # Validate file type
    allowed_extensions = ['.xlsx', '.xls', '.csv', '.pdf']
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save file
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Parse the file
        parsed_data = parse_statement_file(file_path)
        
        # Create statement record
        statement = FinancialStatement(
            company_id=company_id,
            statement_type=statement_type,
            period_start=date.fromisoformat(period_start),
            period_end=date.fromisoformat(period_end),
            fiscal_year=fiscal_year,
            fiscal_quarter=fiscal_quarter,
            file_path=file_path,
            file_type=file_ext[1:],  # Remove the dot
            raw_data=parsed_data,
            uploaded_by=current_user.id
        )
        
        db.add(statement)
        db.commit()
        db.refresh(statement)
        
        return statement
        
    except Exception as e:
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")


@router.get("/{statement_id}", response_model=StatementResponse)
async def get_statement(statement_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_token)):
    """Get a specific financial statement"""
    statement = db.query(FinancialStatement).filter(FinancialStatement.id == statement_id).first()
    
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    return statement
