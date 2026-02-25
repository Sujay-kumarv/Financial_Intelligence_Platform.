from app.db.database import SessionLocal
from app.db.models import User
from app.utils.security import get_password_hash
import logging

# Suppress SQLAlchemy logs
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

def ensure_demo_user():
    print("Opening session...")
    db = SessionLocal()
    try:
        print("Querying for user...")
        user = db.query(User).filter(User.email == 'demo@financial.ai').first()
        if not user:
            print("Demo user not found, creating...")
            user = User(
                email='demo@financial.ai',
                hashed_password=get_password_hash('demo123'),
                full_name='Demo Analyst',
                role='analyst'
            )
            db.add(user)
            print("Committing new user...")
            db.commit()
            print("Demo user created successfully")
        else:
            print("Demo user found, updating password...")
            user.hashed_password = get_password_hash('demo123')
            user.is_active = True
            print("Committing updated user...")
            db.commit()
            print("Demo user password updated successfully")
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        print("Closing session...")
        db.close()

if __name__ == "__main__":
    ensure_demo_user()
