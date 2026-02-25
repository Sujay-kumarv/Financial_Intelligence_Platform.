"""
Test LLM Service
Tests Google Gemini integration with sample financial data
"""
from app.services.llm_service import gemini_service


def test_llm_service():
    """Test the LLM service with sample data"""
    
    print("=" * 60)
    print("TESTING GOOGLE GEMINI LLM INTEGRATION")
    print("=" * 60)
    print()
    
    # Sample computed metrics (NEVER raw financial data)
    sample_metrics = {
        'current_ratio': 2.0,
        'quick_ratio': 1.47,
        'return_on_equity': 33.33,
        'return_on_assets': 20.0,
        'debt_to_equity': 0.67,
        'net_profit_margin': 10.0,
        'operating_profit_margin': 15.0
    }
    
    company_context = {
        'name': 'TechCorp Industries',
        'industry': 'Technology'
    }
    
    # Test 1: General financial analysis
    print("[Test 1] General Financial Analysis")
    print("-" * 60)
    user_question = "What is the overall financial health of this company?"
    
    response = gemini_service.generate_financial_explanation(
        user_message=user_question,
        computed_metrics=sample_metrics,
        company_context=company_context
    )
    
    print(f"Question: {user_question}")
    print(f"\nAI Response:\n{response}")
    print()
    
    # Test 2: Specific ratio inquiry
    print("[Test 2] Specific Ratio Inquiry")
    print("-" * 60)
    user_question = "Is the debt level concerning?"
    
    response = gemini_service.generate_financial_explanation(
        user_message=user_question,
        computed_metrics=sample_metrics,
        company_context=company_context
    )
    
    print(f"Question: {user_question}")
    print(f"\nAI Response:\n{response}")
    print()
    
    # Test 3: Trend analysis
    print("[Test 3] Trend Analysis")
    print("-" * 60)
    
    trend_data = {
        'trend_direction': 'increasing',
        'cagr': 15.5,
        'volatility': 2.3
    }
    
    response = gemini_service.analyze_trends(
        metric_name='revenue',
        trend_data=trend_data
    )
    
    print(f"Metric: Revenue")
    print(f"Trend: {trend_data}")
    print(f"\nAI Analysis:\n{response}")
    print()
    
    # Test 4: Health score explanation
    print("[Test 4] Health Score Explanation")
    print("-" * 60)
    
    response = gemini_service.explain_health_score(
        health_score=85.0,
        risk_level='low',
        red_flags=[],
        warnings=['Quick ratio slightly below industry average']
    )
    
    print(f"Health Score: 85/100")
    print(f"Risk Level: Low")
    print(f"\nAI Explanation:\n{response}")
    print()
    
    print("=" * 60)
    if gemini_service.enabled:
        print("[SUCCESS] LLM Integration is working!")
        print("Google Gemini is providing AI-powered financial insights.")
    else:
        print("[INFO] LLM Integration is using fallback mode")
        print("To enable Gemini, add GEMINI_API_KEY to your .env file")
        print("Get your API key from: https://makersuite.google.com/app/apikey")
    print("=" * 60)


if __name__ == "__main__":
    test_llm_service()
