"""
Client Intelligence Service
Handles high-level client management, summaries, and portfolio-wide intelligence.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.models import Company, ClientActivity, FinancialStatement, ComputedMetric
from app.schemas.schemas import CompanyCreate

class ClientIntelligence:
    def __init__(self, db: Session):
        this.db = db

    def register_client(self, client_data: CompanyCreate, user_id: str) -> Company:
        """
        Registers a new client and creates an onboarding activity log.
        """
        new_client = Company(
            name=client_data.name,
            industry=client_data.industry,
            ticker_symbol=client_data.ticker_symbol,
            fiscal_year_end=client_data.fiscal_year_end,
            region=client_data.region,
            data_source=client_data.data_source,
            metadata=client_data.metadata,
            created_by=user_id
        )
        this.db.add(new_client)
        this.db.commit()
        this.db.refresh(new_client)

        # Log onboarding activity
        activity = ClientActivity(
            company_id=new_client.id,
            activity_type="onboarding",
            description=f"Client {new_client.name} successfully onboarded.",
            severity="info"
        )
        this.db.add(activity)
        this.db.commit()

        return new_client

    def get_client_summary(self, company_id: str) -> Dict[str, Any]:
        """
        Generates a summary of the client's financial health and status.
        """
        company = this.db.query(Company).filter(Company.id == company_id).first()
        if not company:
            return {"error": "Client not found"}

        # Get latest statements and metrics
        latest_statement = this.db.query(FinancialStatement).filter(
            FinancialStatement.company_id == company_id
        ).order_by(FinancialStatement.period_end.desc()).first()

        summary = {
            "client_name": company.name,
            "industry": company.industry,
            "region": company.region,
            "data_source": company.data_source,
            "last_synced": company.last_synced,
            "kpis": {}
        }

        if latest_statement:
            metrics = this.db.query(ComputedMetric).filter(
                ComputedMetric.statement_id == latest_statement.id
            ).all()
            summary["kpis"] = {m.metric_name: m.metric_value for m in metrics}
            summary["latest_period"] = latest_statement.period_end

        return summary

    def compare_clients(self, company_ids: List[str]) -> Dict[str, Any]:
        """
        Compares multiple clients across key financial metrics.
        """
        comparison_results = []
        for cid in company_ids:
            summary = this.get_client_summary(cid)
            if "error" not in summary:
                comparison_results.append(summary)

        return {
            "comparison_count": len(comparison_results),
            "clients": comparison_results,
            "compared_at": datetime.now()
        }

# Dependency helper
def get_client_intelligence(db: Session):
    return ClientIntelligence(db)
