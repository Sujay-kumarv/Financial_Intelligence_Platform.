"""
AI Insight Engine
Automated financial monitoring and cross-portfolio analysis.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.models import Company, FinancialStatement, ComputedMetric, ClientActivity, RiskAssessment
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
        Optimized to avoid N+1 queries.
        """
        from sqlalchemy import func

        companies = self.db.query(Company).all()
        count = len(companies)
        if count == 0:
            return {
                "total_clients": 0, "total_revenue": 0, "avg_health_score": 0,
                "risk_distribution": {"low": 0, "medium": 0, "high": 0},
                "industry_distribution": {}, "last_updated": datetime.now().isoformat()
            }

        company_ids = [c.id for c in companies]

        # 1. Batch fetch latest RiskAssessments
        latest_risk_sub = self.db.query(
            RiskAssessment.company_id,
            func.max(RiskAssessment.assessment_date).label('max_date')
        ).filter(RiskAssessment.company_id.in_(company_ids)).group_by(RiskAssessment.company_id).subquery()

        latest_risks = self.db.query(RiskAssessment).join(
            latest_risk_sub,
            (RiskAssessment.company_id == latest_risk_sub.c.company_id) & 
            (RiskAssessment.assessment_date == latest_risk_sub.c.max_date)
        ).all()

        # 2. Batch fetch latest FinancialStatements for revenue
        latest_stmt_sub = self.db.query(
            FinancialStatement.company_id,
            func.max(FinancialStatement.period_end).label('max_date')
        ).filter(FinancialStatement.company_id.in_(company_ids)).group_by(FinancialStatement.company_id).subquery()

        latest_stmts = self.db.query(FinancialStatement).join(
            latest_stmt_sub,
            (FinancialStatement.company_id == latest_stmt_sub.c.company_id) & 
            (FinancialStatement.period_end == latest_stmt_sub.c.max_date)
        ).all()

        # Aggregate data
        total_revenue = 0
        avg_health_score = 0
        risk_dist = {"low": 0, "medium": 0, "high": 0}
        
        for risk in latest_risks:
            avg_health_score += risk.overall_score
            risk_level = (risk.liquidity_risk or "").lower()
            if "critical" in risk_level or "high" in risk_level: risk_dist["high"] += 1
            elif "warning" in risk_level or "medium" in risk_level: risk_dist["medium"] += 1
            else: risk_dist["low"] += 1

        for stmt in latest_stmts:
            if stmt.raw_data:
                rev = stmt.raw_data.get('income_statement', {}).get('revenue', 0)
                if rev:
                    try:
                        total_revenue += float(str(rev).replace(',', ''))
                    except (ValueError, TypeError):
                        pass

        industry_dist = {}
        for c in companies:
            industry_dist[c.industry] = industry_dist.get(c.industry, 0) + 1

        return {
            "total_clients": count,
            "total_revenue": total_revenue,
            "avg_health_score": avg_health_score / len(latest_risks) if latest_risks else 0,
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
