"""
Database Models
SQLAlchemy ORM models for the application
"""
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    photo_path = Column(String)
    designation = Column(String)
    department = Column(String)
    date_of_joining = Column(Date)
    role = Column(String, default="analyst")  # analyst, admin, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    companies = relationship("Company", back_populates="creator")
    chat_sessions = relationship("ChatSession", back_populates="user")


class RegistrationRequest(Base):
    __tablename__ = "registration_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    photo_path = Column(String)
    date_of_joining = Column(Date)
    designation = Column(String)
    department = Column(String)
    status = Column(String, default="pending")  # pending, approved, rejected
    admin_notes = Column(Text)
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    industry = Column(String)
    ticker_symbol = Column(String)
    fiscal_year_end = Column(String)
    region = Column(String)
    data_source = Column(String)  # excel, api, manual
    company_metadata = Column(JSON, default={})  # Flexible store for industry-specific data
    last_synced = Column(DateTime(timezone=True))
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="companies")
    statements = relationship("FinancialStatement", back_populates="company", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="company")
    activities = relationship("ClientActivity", back_populates="company", cascade="all, delete-orphan")


class FinancialStatement(Base):
    __tablename__ = "financial_statements"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    statement_type = Column(String, nullable=False)  # income_statement, balance_sheet, cash_flow
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    fiscal_year = Column(Integer)
    fiscal_quarter = Column(Integer)
    currency = Column(String, default="USD")
    file_path = Column(String)
    file_type = Column(String)  # pdf, excel, csv, xbrl
    raw_data = Column(JSON)  # Parsed statement data
    uploaded_by = Column(String, ForeignKey("users.id"))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="statements")
    metrics = relationship("ComputedMetric", back_populates="statement", cascade="all, delete-orphan")


class ComputedMetric(Base):
    __tablename__ = "computed_metrics"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    statement_id = Column(String, ForeignKey("financial_statements.id", ondelete="CASCADE"), index=True)
    metric_category = Column(String)  # liquidity, profitability, solvency, efficiency
    metric_name = Column(String)
    metric_value = Column(Float)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    statement = relationship("FinancialStatement", back_populates="metrics")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), index=True)
    assessment_date = Column(Date)
    overall_score = Column(Float)  # 0-100
    liquidity_risk = Column(String)  # low, medium, high
    solvency_risk = Column(String)
    profitability_risk = Column(String)
    red_flags = Column(JSON)  # Array of detected issues
    confidence_level = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="risk_assessments")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    company_id = Column(String, ForeignKey("companies.id"), index=True)
    session_name = Column(String)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True)
    role = Column(String)  # user, assistant
    content = Column(Text)
    message_metadata = Column(JSON)  # Includes computed metrics sent to LLM
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    feedback = relationship("AIFeedback", back_populates="message", uselist=False)


class AIFeedback(Base):
    __tablename__ = "ai_feedback"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    message_id = Column(String, ForeignKey("chat_messages.id", ondelete="CASCADE"), unique=True)
    rating = Column(String)  # helpful, needs_improvement
    correction = Column(Text)
    feedback_metadata = Column(JSON, default={})  # role, time_spent, context
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    message = relationship("ChatMessage", back_populates="feedback")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String)  # login, upload_statement, run_analysis, etc.
    resource_type = Column(String)
    resource_id = Column(String)
    ip_address = Column(String)
    user_agent = Column(Text)
    request_data = Column(JSON)
    response_status = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClientActivity(Base):
    __tablename__ = "client_activities"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String, nullable=False)  # update, alert, onboarding, analysis
    description = Column(Text)
    severity = Column(String, default="info")  # info, warning, critical
    activity_metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="activities")
