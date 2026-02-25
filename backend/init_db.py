"""
Database Initialization Script
Creates all tables and seeds initial data
"""
from app.db.database import engine, Base
from app.db.models import User, Company, FinancialStatement, ComputedMetric, RiskAssessment, ChatSession, ChatMessage, AuditLog


def init_db():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created successfully")


def seed_demo_data():
    """Seed database with demo data for testing"""
    from app.db.database import SessionLocal
    from app.utils.security import get_password_hash
    
    db = SessionLocal()
    
    try:
        # Check if demo user exists
        existing_user = db.query(User).filter(User.email == "demo@financial.ai").first()
        if existing_user:
            print("[OK] Demo user already exists: demo@financial.ai / demo123")
            return
        
        # Create demo user
        hashed_password = get_password_hash("demo123")
        
        demo_user = User(
            email="demo@financial.ai",
            hashed_password=hashed_password,
            full_name="Demo Analyst",
            role="admin"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        
        print("[OK] Demo user created: demo@financial.ai / demo123")
        
    except Exception as e:
        print(f"[ERROR] Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_demo_data()
    print("\n[OK] Database initialization complete!")
