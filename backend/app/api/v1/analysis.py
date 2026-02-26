"""
Analysis Endpoints
Financial ratio analysis, trend analysis, health scores
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import io
import csv
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.db.models import FinancialStatement, ComputedMetric, RiskAssessment, Company
from app.schemas.schemas import (
    RatioAnalysisRequest, RatioAnalysisResponse,
    TrendAnalysisRequest, TrendAnalysisResponse,
    HealthScoreRequest, HealthScoreResponse,
    CompanyComparisonRequest, CompanyComparisonResponse
)
from app.core.financial.ratio_engine import RatioEngine
from app.core.financial.trend_analyzer import TrendAnalyzer
from app.core.financial.risk_scorer import RiskScorer
from app.api.v1.permissions import is_manager_or_admin
from app.api.v1.auth_deps import get_current_user_from_token
from app.db.models import User
from app.services.ai_insight_engine import get_insight_engine

router = APIRouter(prefix="/analysis")

# Basic in-memory cache
PORTFOLIO_CACHE = {"data": None, "timestamp": None}
AI_INSIGHTS_CACHE = {"data": None, "timestamp": None}
CACHE_TTL = 300 # 5 minutes (Data)
AI_CACHE_TTL = 3600 # 1 hour (AI Insights)

@router.get("/portfolio/summary")
async def get_portfolio_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """
    Get aggregated portfolio intelligence and KPI summary (All Authenticated Users)
    """
    global PORTFOLIO_CACHE
    
    # Check cache
    now = datetime.now()
    if PORTFOLIO_CACHE["data"] and PORTFOLIO_CACHE["timestamp"]:
        if (now - PORTFOLIO_CACHE["timestamp"]).total_seconds() < CACHE_TTL:
            return PORTFOLIO_CACHE["data"]

    # Generate fresh summary
    engine = get_insight_engine(db)
    summary = await engine.get_portfolio_summary()
    
    # Return AI narrative from cache if it exists, but don't BLOCK on it
    summary["ai_narrative"] = AI_INSIGHTS_CACHE["data"] or "Sujay AI is analyzing your portfolio..."
    
    # Update cache
    PORTFOLIO_CACHE = {"data": summary, "timestamp": now}
    
    return summary


@router.get("/portfolio/insights")
async def get_portfolio_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """
    Get AI-generated narrative insights for the portfolio (Heavier call)
    """
    global AI_INSIGHTS_CACHE
    
    now = datetime.now()
    if AI_INSIGHTS_CACHE["data"] and AI_INSIGHTS_CACHE["timestamp"]:
        if (now - AI_INSIGHTS_CACHE["timestamp"]).total_seconds() < AI_CACHE_TTL:
            return {"insight": AI_INSIGHTS_CACHE["data"]}

    engine = get_insight_engine(db)
    insight = await engine.generate_portfolio_insights()
    
    AI_INSIGHTS_CACHE = {"data": insight, "timestamp": now}
    return {"insight": insight}


@router.get("/portfolio/export")
async def export_portfolio_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """
    Export portfolio summary and insights as a CSV file.
    """
    print(">>> REACHED /portfolio/export ENDPOINT <<<")

    engine = get_insight_engine(db)
    summary = await engine.get_portfolio_summary()
    
    # Get insights (from cache if possible to avoid re-running LLM)
    global AI_INSIGHTS_CACHE
    insights = AI_INSIGHTS_CACHE["data"]
    if not insights:
        insights_res = await engine.generate_portfolio_insights()
        insights = insights_res
        AI_INSIGHTS_CACHE = {"data": insights, "timestamp": datetime.now()}
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Financial Intelligence Platform - Aggregate Performance Report"])
    writer.writerow(["Generated At", datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
    writer.writerow([])
    
    writer.writerow(["SECTION 1: Key Performance Indicators"])
    writer.writerow(["Metric", "Value", "Notes"])
    writer.writerow(["Total Managed Clients", summary['total_clients'], "Across all industries"])
    writer.writerow(["Total Managed Assets (Revenue)", f"${summary['total_revenue']:,.2f}", "Sum of latest statements"])
    writer.writerow(["Average Health Score", f"{summary['avg_health_score']:.1f}/100", "Weighted average of risk assessments"])
    writer.writerow([])
    
    writer.writerow(["SECTION 2: Risk Distribution"])
    writer.writerow(["Risk Level", "Count", "Percentage"])
    for level, count in summary['risk_distribution'].items():
        percentage = (count / summary['total_clients'] * 100) if summary['total_clients'] > 0 else 0
        writer.writerow([level.capitalize(), count, f"{percentage:.1f}%"])
    writer.writerow([])
    
    writer.writerow(["SECTION 3: Industry Exposure"])
    writer.writerow(["Industry", "Client Count", "Market Share (%)"])
    for industry, count in summary['industry_distribution'].items():
        percentage = (count / summary['total_clients'] * 100) if summary['total_clients'] > 0 else 0
        writer.writerow([industry, count, f"{percentage:.1f}%"])
    writer.writerow([])
    
    writer.writerow(["SECTION 4: AI Strategic Narrative"])
    # Split narrative by lines to avoid huge single cells in CSV
    narrative_lines = insights.split('\n')
    for line in narrative_lines:
        if line.strip():
            writer.writerow([line.strip()])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')), # Use UTF-8 with BOM for Excel compatibility
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=portfolio_performance_report.csv",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.post("/ratios", response_model=RatioAnalysisResponse)
async def analyze_ratios(request: RatioAnalysisRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_token)):
    """
    Calculate all financial ratios for a statement
    """
    # Get statement
    statement = db.query(FinancialStatement).filter(
        FinancialStatement.id == request.statement_id
    ).first()
    
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    # Extract data from parsed statement
    raw_data = statement.raw_data
    balance_sheet = raw_data.get('balance_sheet', {})
    income_statement = raw_data.get('income_statement', {})
    cash_flow = raw_data.get('cash_flow', {})
    
    # Compute ratios
    engine = RatioEngine(balance_sheet, income_statement, cash_flow)
    ratios = engine.compute_all_ratios()
    
    # Save computed metrics to database
    for category, metrics in ratios.items():
        for metric_name, metric_value in metrics.items():
            if metric_value is not None:
                computed_metric = ComputedMetric(
                    statement_id=statement.id,
                    metric_category=category,
                    metric_name=metric_name,
                    metric_value=metric_value
                )
                db.add(computed_metric)
    
    db.commit()
    
    return {
        "statement_id": statement.id,
        "ratios": ratios,
        "computed_at": datetime.now()
    }


@router.post("/trends", response_model=TrendAnalysisResponse)
async def analyze_trends(request: TrendAnalysisRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_token)):
    """
    Analyze trends for a specific metric across multiple periods
    """
    # Get all statements for the company
    statements = db.query(FinancialStatement).filter(
        FinancialStatement.company_id == request.company_id
    ).order_by(FinancialStatement.period_end).all()
    
    if not statements:
        raise HTTPException(status_code=404, detail="No statements found for company")
    
    # Prepare historical data
    historical_data = []
    for stmt in statements:
        # Get computed metrics for this statement
        metrics = db.query(ComputedMetric).filter(
            ComputedMetric.statement_id == stmt.id
        ).all()
        
        metrics_dict = {m.metric_name: m.metric_value for m in metrics}
        
        historical_data.append({
            'period': stmt.period_end,
            'metrics': metrics_dict
        })
    
    # Analyze trends
    analyzer = TrendAnalyzer(historical_data)
    analysis = analyzer.analyze_all_trends(request.metric_name)
    
    return analysis


@router.post("/health-score", response_model=HealthScoreResponse)
async def calculate_health_score(request: HealthScoreRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_token)):
    """
    Calculate financial health score (0-100) and identify risks
    """
    # Get statement
    statement = db.query(FinancialStatement).filter(
        FinancialStatement.id == request.statement_id
    ).first()
    
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    # Get computed ratios
    raw_data = statement.raw_data
    balance_sheet = raw_data.get('balance_sheet', {})
    income_statement = raw_data.get('income_statement', {})
    cash_flow = raw_data.get('cash_flow', {})
    
    # Compute ratios
    engine = RatioEngine(balance_sheet, income_statement, cash_flow)
    ratios = engine.compute_all_ratios()
    
    # Calculate risk score
    scorer = RiskScorer(ratios)
    assessment = scorer.get_assessment()
    
    # Save risk assessment to database
    risk_record = RiskAssessment(
        company_id=statement.company_id,
        assessment_date=statement.period_end,
        overall_score=assessment['overall_score'],
        liquidity_risk=assessment['category_scores']['liquidity']['risk'],
        solvency_risk=assessment['category_scores']['solvency']['risk'],
        profitability_risk=assessment['category_scores']['profitability']['risk'],
        red_flags=assessment['red_flags'],
        confidence_level=95.0  # Placeholder
    )
    
    db.add(risk_record)
    db.commit()
    
    return assessment


@router.post("/compare", response_model=CompanyComparisonResponse)
async def compare_companies(request: CompanyComparisonRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_token)):
    """
    Compare multiple companies based on their latest financial statements
    """
    from app.services.financial_analyzer import analyzer
    
    companies_data = []
    
    for company_id in request.company_ids:
        # Get company details
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            continue
            
        # Get latest statement
        statement = db.query(FinancialStatement).filter(
            FinancialStatement.company_id == company_id
        ).order_by(FinancialStatement.period_end.desc()).first()
        
        if statement:
            # Get computed metrics
            metrics = db.query(ComputedMetric).filter(
                ComputedMetric.statement_id == statement.id
            ).all()
            
            metrics_dict = {m.metric_name: m.metric_value for m in metrics}
            
            companies_data.append({
                "id": company.id,
                "name": company.name,
                "industry": company.industry,
                "ratios": metrics_dict,
                "extracted_data": statement.raw_data
            })
    
    if not companies_data:
        raise HTTPException(status_code=400, detail="No valid data found for the selected companies")
        
    # Generate AI comparison
    comparison_result = await analyzer.compare_companies(companies_data)
    
    # Structure the response
    # We can enhance this to build the comparison_table and charts_data here 
    # if the AI doesn't return them fully populated, or rely on the AI's output.
    # For now, we assume the AI (or a helper) provides the structure.
    
    # Fallback/Structure builder if AI only returns text/insights
    if "comparison_table" not in comparison_result:
        # Build table manually from metrics
        comp_table = {}
        # Get all unique metric names
        all_metrics = set()
        for c in companies_data:
            all_metrics.update(c['ratios'].keys())
            
        for metric in all_metrics:
            comp_table[metric] = {}
            for c in companies_data:
                comp_table[metric][c['id']] = c['ratios'].get(metric, None)
                
        comparison_result["comparison_table"] = comp_table
        
    if "charts_data" not in comparison_result:
        # Build simple charts data
        comparison_result["charts_data"] = {
            "metrics": ["current_ratio", "debt_to_equity", "net_profit_margin"],
            "data": comparison_result["comparison_table"] 
        }

    return {
        "comparison_table": comparison_result.get("comparison_table", {}),
        "charts_data": comparison_result.get("charts_data", {}),
        "ai_insights": comparison_result.get("ai_insights", {}),
        "created_at": datetime.now()
    }
