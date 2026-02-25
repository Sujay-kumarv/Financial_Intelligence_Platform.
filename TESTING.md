# Quick Test Guide

## Test the Ratio Engine (No Dependencies Required)

The ratio engine is pure Python and doesn't need any external dependencies!

### Run the Test

```powershell
cd D:\Financial_Intelligence_Platform\backend
python test_ratio_engine.py
```

This will:
- Test all 25+ financial ratios
- Use sample company data
- Show formatted results with health indicators
- Save results to `test_results.json`

### Expected Output

You should see:
```
============================================================
FINANCIAL INTELLIGENCE PLATFORM - RATIO ENGINE TEST
============================================================

📊 SAMPLE COMPANY FINANCIAL DATA
------------------------------------------------------------
Revenue: $1,500,000
Net Income: $1,000,000
Total Assets: $5,000,000
Total Equity: $3,000,000

🔢 COMPUTING FINANCIAL RATIOS...

============================================================
LIQUIDITY RATIOS
============================================================
  Current Ratio: 2.00
  Quick Ratio: 1.47
  Cash Ratio: 0.67
  Working Capital: $750,000.00
  Operating Cash Flow Ratio: 1.60

  Current Ratio Status: ✅ HEALTHY

============================================================
PROFITABILITY RATIOS
============================================================
  Gross Profit Margin: 40.00%
  Operating Profit Margin: 15.00%
  Net Profit Margin: 10.00%
  Return On Assets: 20.00%
  Return On Equity: 33.33%
  Return On Invested Capital: 22.50%

  ROE Status: ✅ EXCELLENT

... (and more)
```

## Full Setup (For Complete Platform)

### 1. Create Virtual Environment

```powershell
cd D:\Financial_Intelligence_Platform\backend
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment

```powershell
copy .env.example .env
```

Edit `.env` and add:
- `GEMINI_API_KEY=your_key_here`
- `JWT_SECRET_KEY=your-secret-key-at-least-32-characters-long`

### 4. Initialize Database

```powershell
python init_db.py
```

### 5. Run the Server

```powershell
python -m app.main
```

Or:

```powershell
uvicorn app.main:app --reload
```

### 6. Access the API

- API: http://localhost:8000
- Docs: http://localhost:8000/api/docs
- Demo Login: demo@financial.ai / demo123

## Troubleshooting

### Import Errors
If you get import errors, make sure you're in the `backend` directory and all `__init__.py` files exist.

### Missing Dependencies
Run: `pip install -r requirements.txt`

### Database Errors
Delete `financial_intelligence.db` and run `python init_db.py` again.

## What's Working

✅ Financial Ratio Engine (25+ ratios)
✅ Database Models
✅ Configuration System
✅ FastAPI Application Structure

## What's Not Built Yet

❌ Statement Parsers
❌ API Endpoints
❌ LLM Integration
❌ Frontend UI
❌ Trend Analysis
❌ Risk Scoring

---

**Start with the simple test first!**
```powershell
python test_ratio_engine.py
```
