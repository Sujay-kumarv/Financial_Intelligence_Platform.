"""
Seed Demo Companies Script
Populates the database with sample client companies for the Client Intelligence panel.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.db.models import Company, User
import uuid

def generate_uuid():
    return str(uuid.uuid4())

DEMO_COMPANIES = [
    {
        "name": "Apex Capital Ventures",
        "industry": "Investment Banking",
        "ticker_symbol": "ACV",
        "fiscal_year_end": "December",
        "region": "North America",
        "data_source": "manual",
    },
    {
        "name": "Horizon Wealth Management",
        "industry": "Asset Management",
        "ticker_symbol": "HWM",
        "fiscal_year_end": "December",
        "region": "North America",
        "data_source": "manual",
    },
    {
        "name": "NexaBank Financial Group",
        "industry": "Commercial Banking",
        "ticker_symbol": "NBF",
        "fiscal_year_end": "December",
        "region": "Europe",
        "data_source": "manual",
    },
    {
        "name": "Stellar FinTech Solutions",
        "industry": "Financial Technology",
        "ticker_symbol": "SFS",
        "fiscal_year_end": "March",
        "region": "Asia Pacific",
        "data_source": "manual",
    },
    {
        "name": "Meridian Insurance Corp",
        "industry": "Insurance",
        "ticker_symbol": "MIC",
        "fiscal_year_end": "December",
        "region": "North America",
        "data_source": "manual",
    },
    {
        "name": "PrimeCredit Partners",
        "industry": "Consumer Finance",
        "ticker_symbol": "PCP",
        "fiscal_year_end": "June",
        "region": "North America",
        "data_source": "manual",
    },
    {
        "name": "Aurora Private Equity",
        "industry": "Private Equity",
        "ticker_symbol": "APE",
        "fiscal_year_end": "December",
        "region": "Europe",
        "data_source": "manual",
    },
]


def seed_companies():
    db = SessionLocal()
    try:
        # Get an existing admin user to set as creator
        admin_user = db.query(User).first()
        creator_id = admin_user.id if admin_user else None

        existing_count = db.query(Company).count()
        if existing_count > 0:
            print(f"[OK] {existing_count} companies already exist. Skipping seed.")
            return

        added = 0
        for company_data in DEMO_COMPANIES:
            company = Company(
                id=generate_uuid(),
                name=company_data["name"],
                industry=company_data["industry"],
                ticker_symbol=company_data["ticker_symbol"],
                fiscal_year_end=company_data["fiscal_year_end"],
                region=company_data["region"],
                data_source=company_data["data_source"],
                company_metadata={},
                created_by=creator_id,
            )
            db.add(company)
            added += 1
            print(f"  + Added: {company_data['name']} ({company_data['industry']})")

        db.commit()
        print(f"\n[OK] Successfully seeded {added} demo companies!")

    except Exception as e:
        print(f"[ERROR] Failed to seed companies: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding demo client companies...")
    seed_companies()
