"""
Enhanced Chat Endpoints with File Upload Support
AI-powered financial chat with document analysis
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.db.database import get_db
from app.schemas.schemas import ChatMessageRequest, ChatMessageResponse, ChatSessionResponse, ChatSessionCreate, AIFeedbackCreate, AIFeedbackResponse
from app.db.models import ChatSession, ChatMessage, ComputedMetric, FinancialStatement, User, AIFeedback
from app.services.llm_service import gemini_service
from app.services.memory_service import memory_service
from app.api.v1.auth_deps import get_current_user_from_token

router = APIRouter(prefix="/chat")


@router.post("/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    message: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """
    Analyze uploaded financial document with AI
    """
    try:
        # Read file content
        content = await file.read()
        
        # Convert bytes to string (for text-based files)
        # Convert bytes to string (for text-based files)
        try:
            file_content = content.decode('utf-8')
        except:
            # Try parsing as PDF
            try:
                import io
                import PyPDF2
                
                pdf_file = io.BytesIO(content)
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                file_content = ""
                for page in pdf_reader.pages:
                    file_content += page.extract_text() + "\n"
            except Exception as e:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": f"Failed to parse file. Please upload Excel, CSV, or PDF files. Error: {str(e)}"
                    }
                )
        
        # Analyze the document
        analysis_result = await analyzer.analyze_document(file_content, file.filename)
        
        # If user provided a message/question, answer it with context
        if message and analysis_result.get('success'):
            answer = await analyzer.answer_query(message, analysis_result)
            analysis_result['query_response'] = answer
        
        return JSONResponse(content=analysis_result)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": f"Failed to analyze document: {str(e)}"
            }
        )


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(request: ChatMessageRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_token)):
    """
    Send a message to the AI financial advisor
    """
    # Create or get session
    if request.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == request.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        # Create new session
        session = ChatSession(
            user_id=current_user.id,
            company_id=request.company_id,
            session_name="Financial Analysis Chat"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    
    # Save user message
    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    db.commit()
    
    # Get user profile for adaptation
    user_context = memory_service.get_user_profile_context(current_user.id)
    
    # Store user message in vector memory
    memory_service.store_interaction(
        message_id=user_message.id,
        content=request.message,
        role="user",
        metadata={
            "user_id": current_user.id,
            "session_id": session.id,
            "company_id": request.company_id,
            "role": current_user.role
        }
    )
    
    # Get context (computed metrics for the company)
    context_metrics = {}
    company_info = None
    
    if request.company_id:
        # Get company information
        from app.db.models import Company
        company = db.query(Company).filter(Company.id == request.company_id).first()
        if company:
            company_info = {
                'name': company.name,
                'industry': company.industry,
                'ticker_symbol': company.ticker_symbol
            }
        
        # Get latest statement
        latest_statement = db.query(FinancialStatement).filter(
            FinancialStatement.company_id == request.company_id
        ).order_by(FinancialStatement.period_end.desc()).first()
        
        if latest_statement:
            metrics = db.query(ComputedMetric).filter(
                ComputedMetric.statement_id == latest_statement.id
            ).all()
            
            context_metrics = {m.metric_name: m.metric_value for m in metrics}
    
    # Detect intent and generate AI response
    from app.services.llm_service import gemini_service
    
    intent_data = gemini_service.parse_intent(request.message)
    
    ai_response = gemini_service.generate_financial_explanation(
        user_message=request.message,
        computed_metrics=context_metrics,
        company_context=company_info,
        user_id=current_user.id
    )
    
    # Combined metadata
    msg_metadata = {
        "context_metrics": context_metrics,
        "intent": intent_data.get("intent"),
        "action_trigger": intent_data.get("action"),
        "action_params": intent_data.get("params"),
        "adaptive_context": user_context
    }
    
    # Save AI response
    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=ai_response,
        message_metadata=msg_metadata
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    
    # Store AI response in vector memory
    memory_service.store_interaction(
        message_id=assistant_message.id,
        content=ai_response,
        role="assistant",
        metadata={
            "user_id": current_user.id,
            "session_id": session.id,
            "company_id": request.company_id,
            "role": current_user.role
        }
    )
    
    return assistant_message


@router.post("/feedback", response_model=AIFeedbackResponse)
async def create_feedback(
    feedback_data: AIFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """
    Submit user feedback for an AI message
    """
    # Verify message exists and belongs to a session directed by the user
    message = db.query(ChatMessage).filter(ChatMessage.id == feedback_data.message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if feedback already exists
    existing = db.query(AIFeedback).filter(AIFeedback.message_id == feedback_data.message_id).first()
    if existing:
        # Update existing
        existing.rating = feedback_data.rating
        existing.correction = feedback_data.correction
        existing.feedback_metadata = {
            **(existing.feedback_metadata or {}),
            **(feedback_data.feedback_metadata or {}),
            "updated_at": str(func.now())
        }
    else:
        # Create new feedback
        existing = AIFeedback(
            message_id=feedback_data.message_id,
            rating=feedback_data.rating,
            correction=feedback_data.correction,
            feedback_metadata={
                **(feedback_data.feedback_metadata or {}),
                "user_role": current_user.role,
                "user_email": current_user.email
            }
        )
        db.add(existing)
    
    db.commit()
    db.refresh(existing)
    return existing


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_token)):
    """List all chat sessions for the current user"""
    sessions = db.query(ChatSession).order_by(ChatSession.last_activity.desc()).all()
    return sessions


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(session_data: ChatSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_token)):
    """Create a new chat session"""
    # Create new session
    session = ChatSession(
        user_id=current_user.id,
        company_id=session_data.company_id,
        session_name="Financial Analysis Chat"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_session_messages(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_token)):
    """Get all messages in a chat session"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()
    
    return messages
