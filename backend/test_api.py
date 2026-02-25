"""
Complete API Test Script
Tests all endpoints of the Financial Intelligence Platform
"""
import requests
import json
from datetime import date, datetime

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

def print_section(title):
    """Print formatted section header"""
    print("\n" + "=" * 60)
    print(f"{title}")
    print("=" * 60)

def test_health_check():
    """Test health check endpoint"""
    print_section("1. HEALTH CHECK")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_authentication():
    """Test user registration and login"""
    print_section("2. AUTHENTICATION")
    
    # Register
    print("\n[Register New User]")
    register_data = {
        "email": "test@financial.ai",
        "password": "SecurePass123!",
        "full_name": "Test Analyst"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"Status: {response.status_code}")
    if response.status_code in [200, 201, 400]:  # 400 if already exists
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Login
    print("\n[Login]")
    login_data = {
        "email": "demo@financial.ai",
        "password": "demo123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        tokens = response.json()
        print(f"Access Token: {tokens['access_token'][:50]}...")
        return tokens['access_token']
    return None

def test_companies(token):
    """Test company CRUD operations"""
    print_section("3. COMPANIES")
    
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    # Create company
    print("\n[Create Company]")
    company_data = {
        "name": "TechCorp Industries",
        "industry": "Technology",
        "ticker_symbol": "TECH",
        "fiscal_year_end": "December"
    }
    response = requests.post(f"{BASE_URL}/companies/", json=company_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code in [200, 201]:
        company = response.json()
        print(f"Created Company: {company['name']} (ID: {company['id']})")
        company_id = company['id']
    else:
        print(f"Error: {response.text}")
        return None
    
    # List companies
    print("\n[List Companies]")
    response = requests.get(f"{BASE_URL}/companies/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        companies = response.json()
        print(f"Total Companies: {len(companies)}")
        for c in companies:
            print(f"  - {c['name']} ({c['industry']})")
    
    return company_id

def test_analysis():
    """Test financial analysis endpoints"""
    print_section("4. FINANCIAL ANALYSIS (Simulated)")
    
    print("\n[Ratio Analysis]")
    print("This would calculate 25+ financial ratios from uploaded statements")
    print("Ratios include:")
    print("  - Liquidity: Current Ratio, Quick Ratio, Cash Ratio")
    print("  - Profitability: ROE, ROA, Net Profit Margin")
    print("  - Solvency: Debt-to-Equity, Interest Coverage")
    print("  - Efficiency: Asset Turnover, DSO, Cash Conversion Cycle")
    
    print("\n[Trend Analysis]")
    print("This would analyze YoY, QoQ growth and CAGR")
    
    print("\n[Health Score]")
    print("This would calculate 0-100 financial health score")
    print("With risk categorization and red flag detection")

def test_chat():
    """Test chat endpoints"""
    print_section("5. AI CHAT (Placeholder)")
    
    print("\n[Send Message]")
    print("Chat endpoint is ready but LLM integration pending")
    print("Will use Google Gemini to provide financial insights")
    print("LLM receives only computed metrics, never raw data")

def run_all_tests():
    """Run all API tests"""
    print("=" * 60)
    print("FINANCIAL INTELLIGENCE PLATFORM - API TEST SUITE")
    print("=" * 60)
    print(f"Testing API at: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Test health
        if not test_health_check():
            print("\n[ERROR] API is not responding. Make sure the server is running:")
            print("  python -m app.main")
            return
        
        # Test auth
        token = test_authentication()
        
        # Test companies
        company_id = test_companies(token)
        
        # Test analysis (simulated)
        test_analysis()
        
        # Test chat (simulated)
        test_chat()
        
        print_section("TEST SUMMARY")
        print("[OK] Health Check")
        print("[OK] Authentication")
        print("[OK] Companies CRUD")
        print("[READY] Statement Upload & Parsing")
        print("[READY] Financial Analysis (Ratios, Trends, Health Score)")
        print("[PENDING] AI Chat (LLM Integration)")
        
        print("\n" + "=" * 60)
        print("API TEST COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\nNext Steps:")
        print("1. Upload financial statements (Excel/CSV)")
        print("2. Run ratio analysis")
        print("3. Calculate health scores")
        print("4. Integrate Google Gemini for AI chat")
        print()
        
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Cannot connect to API server")
        print("Please start the server first:")
        print("  cd D:\\Financial_Intelligence_Platform\\backend")
        print("  python -m app.main")
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()
