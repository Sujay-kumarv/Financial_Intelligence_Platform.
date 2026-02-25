# Quick Start Guide - Financial Intelligence Platform

## Option 1: Test Ratio Engine (No Dependencies Required)

The ratio engine is pure Python and works immediately:

```powershell
cd D:\Financial_Intelligence_Platform\backend
python test_ratio_engine.py
```

**This will show:**
- All 25+ financial ratios calculated
- Health indicators for sample company
- Results saved to `test_results.json`

---

# Quick Start Guide | Sujay Kumar AI Studio

Follow these steps to get the Financial Co-Pilot up and running in minutes.

## 🏃 1. Rapid Launch (Docker)

If you have Docker installed, this is the fastest way to start:

```powershell
# Root directory
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/api/docs

---

## 🛠️ 2. Manual Installation

### Backend Setup
1. **Navigate to backend**: `cd backend`
2. **Setup Venv**: `python -m venv venv` and `.\venv\Scripts\activate`
3. **Install Dependencies**: `pip install -r requirements.txt`
4. **Environment**: Create `.env` from `.env.example`.
   - **REQUIRED**: `GEMINI_API_KEY`
5. **Initialize DB**: `python init_db.py`
6. **Start Server**: `python -m app.main`

### Frontend Setup
1. **Navigate to frontend**: `cd frontend-next`
2. **Install**: `npm install`
3. **Launch**: `npm run dev`

---

## 🔑 3. Authentication & Access
- **Default Account**: `demo@financial.ai` / `demo123`
- **Role**: `admin`

### Key Features to Explore
- **Add Client**: Click "Add Client" in the sidebar or tell the Co-Pilot: "Add a new client for me."
- **Portfolio Summary**: Switch to "Portfolio Summary" view (Manager/Admin only) to see aggregate intelligence.
- **AI Chat**: Ask the Co-Pilot: "Compare my active clients" or "What's the health score of Acme Corp?"

---

**Next Steps**: Review the [DOCKER.md](./DOCKER.md) for production optimization.

**Expected output:**
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 4: Test the API

**Open a new terminal** and run:

```powershell
cd D:\Financial_Intelligence_Platform\backend
python test_api.py
```

Or visit in your browser:
- API Docs: http://localhost:8000/api/docs
- Health Check: http://localhost:8000/api/v1/health

---

## Quick Test Commands

### Test 1: Ratio Engine (Works Now!)
```powershell
python test_ratio_engine.py
```

### Test 2: API Health (After setup)
```powershell
curl http://localhost:8000/api/v1/health
```

### Test 3: Full API Test Suite (After setup)
```powershell
python test_api.py
```

---

## What Each Test Does

### Ratio Engine Test
- ✅ Tests 25+ financial ratio calculations
- ✅ Uses sample company data ($10M revenue)
- ✅ Shows health assessment
- ✅ Saves results to JSON
- ⏱️ Takes: ~1 second
- 📦 Dependencies: None (pure Python)

### API Test Suite
- ✅ Tests all REST endpoints
- ✅ Creates test company
- ✅ Tests authentication
- ✅ Validates responses
- ⏱️ Takes: ~5 seconds
- 📦 Dependencies: FastAPI, SQLAlchemy, etc.

---

## Troubleshooting

### "ModuleNotFoundError"
**Solution:** Install dependencies
```powershell
pip install -r requirements.txt
```

### "Cannot connect to API"
**Solution:** Start the server first
```powershell
python -m app.main
```

### "Port 8000 already in use"
**Solution:** Kill the existing process or change port in `app/main.py`

---

## Current Status

**✅ Working Without Setup:**
- Ratio Engine (25+ ratios)
- Risk Scorer (0-100 health score)
- Trend Analyzer (YoY, QoQ, CAGR)

**✅ Working After Setup:**
- Full REST API
- Database persistence
- File upload & parsing
- Authentication
- Chat sessions

**🚧 Coming Soon:**
- Google Gemini LLM integration
- React frontend UI
- Docker deployment

---

## Recommended Testing Path

1. **Start Simple** → Run `python test_ratio_engine.py`
2. **Install Dependencies** → Run `pip install -r requirements.txt`
3. **Initialize Database** → Run `python init_db.py`
4. **Start Server** → Run `python -m app.main`
5. **Test API** → Run `python test_api.py` (in new terminal)

---

**Need Help?** Check the main [README.md](../README.md) for detailed documentation.
