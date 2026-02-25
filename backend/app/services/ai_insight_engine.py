"""
AI Insight Engine
Automated financial monitoring and cross-portfolio analysis.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.models import Company, FinancialStatement, ComputedMetric, ClientActivity
from app.services.llm_service import groq_service as llm_service

class AIInsightEngine:
    def __init__(self, db: Session):
        self.db = db

    async def detect_anomalies(self, company_id: str) -> List[Dict[str, Any]]:
        """
        Identify performance anomalies (e.g., sudden margin drops, growth spikes).
        """
        # Get latest statements
        statements = self.db.query(FinancialStatement).filter(
            FinancialStatement.company_id == company_id
        ).order_by(FinancialStatement.period_end.desc()).limit(2).all()

        if len(statements) < 2:
            return []

        # Compare metrics between periods
        anomalies = []
        # Simplified logic: compare some key metrics
        metric_names = ["net_profit_margin", "current_ratio", "debt_to_equity"]
        
        for metric_name in metric_names:
            m1 = self.db.query(ComputedMetric).filter(
                ComputedMetric.statement_id == statements[0].id,
                ComputedMetric.metric_name == metric_name
            ).first()
            m2 = self.db.query(ComputedMetric).filter(
                ComputedMetric.statement_id == statements[1].id,
                ComputedMetric.metric_name == metric_name
            ).first()

            if m1 and m2:
                # Basic threshold check
                change = (m1.metric_value - m2.metric_value) / abs(m2.metric_value) if m2.metric_value != 0 else 0
                if abs(change) > 0.2:  # 20% threshold
                    anomalies.append({
                        "metric": metric_name,
                        "change": change,
                        "description": f"Significant {metric_name} change of {change:.1%}"
                    })

        # Save anomalies as ClientActivity (alerts)
        for anomaly in anomalies:
            activity = ClientActivity(
                company_id=company_id,
                activity_type="alert",
                description=anomaly["description"],
                severity="warning" if anomaly["change"] < 0 else "info",
                metadata={"metric": anomaly["metric"], "change": anomaly["change"]}
            )
            self.db.add(activity)
        
        self.db.commit()
        return anomalies

    async def get_portfolio_summary(self) -> Dict[str, Any]:
        """
        Calculates aggregate metrics and risk distribution across all clients.
        """
        companies = self.db.query(Company).all()
        total_revenue = 0
        avg_health_score = 0
        risk_dist = {"low": 0, "medium": 0, "high": 0}
        industry_dist = {}
        
        for c in companies:
            # Get latest health score
            risk = self.db.query(RiskAssessment).filter(
                RiskAssessment.company_id == c.id
            ).order_by(RiskAssessment.assessment_date.desc()).first()
            
            if risk:
                avg_health_score += risk.overall_score
                risk_level = risk.liquidity_risk.lower() # Simplified
                if "critical" in risk_level: risk_dist["high"] += 1
                elif "warning" in risk_level: risk_dist["medium"] += 1
                else: risk_dist["low"] += 1
            
            # Get latest statement for revenue
            stmt = self.db.query(FinancialStatement).filter(
                FinancialStatement.company_id == c.id
            ).order_by(FinancialStatement.period_end.desc()).first()
            
            if stmt:
                rev = stmt.raw_data.get('income_statement', {}).get('revenue', 0)
                total_revenue += float(str(rev).replace(',', '')) if rev else 0

            industry_dist[c.industry] = industry_dist.get(c.industry, 0) + 1

        count = len(companies)
        
        return {
            "total_clients": count,
            "total_revenue": total_revenue,
            "avg_health_score": avg_health_score / count if count > 0 else 0,
            "risk_distribution": risk_dist,
            "industry_distribution": industry_dist,
            "last_updated": datetime.now().isoformat()
        }

    async def generate_portfolio_insights(self) -> str:
        """
        Generate a summary of the entire client portfolio.
        """
        companies = self.db.query(Company).all()
        portfolio_stats = {
            "total_clients": len(companies),
            "industries": {}
        }
        
        for c in companies:
            portfolio_stats["industries"][c.industry] = portfolio_stats["industries"].get(c.industry, 0) + 1
            
        # Use LLM to generate a narrative summary
        prompt = f"Analyze this portfolio summary and provide 3 key executive insights:\n{portfolio_stats}"
        return llm_service.generate_financial_explanation(prompt)

def get_insight_engine(db: Session):
    return AIInsightEngine(db)
