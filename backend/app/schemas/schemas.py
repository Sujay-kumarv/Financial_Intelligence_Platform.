"""
Pydantic Schemas for API Request/Response
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime


# ===========================
# Authentication Schemas
# ===========================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    role: Optional[str] = "readonly"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    date_of_joining: Optional[date] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    date_of_joining: Optional[date] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    date_of_joining: Optional[date] = None
    photo_path: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===========================
# Registration Schemas
# ===========================

class RegistrationResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    photo_path: Optional[str] = None
    date_of_joining: Optional[date] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    temp_password: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RegistrationAction(BaseModel):
    admin_notes: Optional[str] = None


# ===========================
# Company Schemas
# ===========================

class CompanyCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    ticker_symbol: Optional[str] = None
    fiscal_year_end: Optional[str] = None
    region: Optional[str] = None
    data_source: Optional[str] = "manual"
    metadata: Optional[Dict[str, Any]] = {}


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    ticker_symbol: Optional[str] = None
    fiscal_year_end: Optional[str] = None
    region: Optional[str] = None
    data_source: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CompanyResponse(BaseModel):
    id: str
    name: str
    industry: Optional[str]
    ticker_symbol: Optional[str]
    fiscal_year_end: Optional[str]
    region: Optional[str]
    data_source: Optional[str]
    company_metadata: Optional[Dict[str, Any]] = Field(None, alias="company_metadata")
    last_synced: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True


# ===========================
# Financial Statement Schemas
# ===========================

class StatementUpload(BaseModel):
    company_id: str
    statement_type: str  # income_statement, balance_sheet, cash_flow
    period_start: date
    period_end: date
    fiscal_year: Optional[int] = None
    fiscal_quarter: Optional[int] = None
    currency: str = "USD"


class StatementResponse(BaseModel):
    id: str
    company_id: str
    statement_type: str
    period_start: date
    period_end: date
    fiscal_year: Optional[int]
    fiscal_quarter: Optional[int]
    currency: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


# ===========================
# Analysis Schemas
# ===========================

class RatioAnalysisRequest(BaseModel):
    statement_id: str


class RatioAnalysisResponse(BaseModel):
    statement_id: str
    ratios: Dict[str, Dict[str, Optional[float]]]
    computed_at: datetime


class TrendAnalysisRequest(BaseModel):
    company_id: str
    metric_name: str
    periods: Optional[int] = None


class TrendAnalysisResponse(BaseModel):
    metric: str
    yoy_growth: List[Dict]
    qoq_growth: List[Dict]
    cagr: Optional[float]
    trend_direction: str
    volatility: Optional[float]


class HealthScoreRequest(BaseModel):
    statement_id: str


class HealthScoreResponse(BaseModel):
    overall_score: float
    risk_level: str
    category_scores: Dict
    red_flags: List[str]
    warnings: List[str]
    recommendation: str


# ===========================
# Chat Schemas
# ===========================

class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    company_id: Optional[str] = None
    message: str


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    message_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class AIFeedbackCreate(BaseModel):
    message_id: str
    rating: str  # helpful, needs_improvement
    correction: Optional[str] = None
    feedback_metadata: Optional[Dict[str, Any]] = None


class AIFeedbackResponse(BaseModel):
    id: str
    message_id: str
    rating: str
    correction: Optional[str]
    feedback_metadata: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    id: str
    company_id: Optional[str]
    session_name: Optional[str]
    started_at: datetime
    last_activity: datetime
    
    class Config:
        from_attributes = True


class ChatSessionCreate(BaseModel):
    company_id: str


# ===========================
# Comparison Schemas
# ===========================

class CompanyComparisonRequest(BaseModel):
    company_ids: List[str]
    metrics: Optional[List[str]] = None


class CompanyComparisonResponse(BaseModel):
    comparison_table: Dict[str, Dict[str, Any]]  # {metric_name: {company_id: value}}
    charts_data: Dict[str, Any]
    ai_insights: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.now)

