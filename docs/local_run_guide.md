# Local Run Guide – Financial Intelligence Platform

## Overview
This guide helps you run the **Financial Intelligence Platform** locally using either:
- **Manual installation** (recommended for development), or
- **Docker setup** (recommended for a quick start).

---

## Prerequisites
Before you begin, make sure the following are installed:

| Tool | Version (Recommended) | Check Command |
|------|-----------------------|----------------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | Latest | `git --version` |
| Docker | Latest | `docker --version` |
| Docker Compose | v2+ | `docker compose version` |

Also, make sure you have a **Gemini API Key**.

---

## Setup Method A – Manual Installation (Recommended for Development)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-org>/financial_intelligence_platform.git
cd financial_intelligence_platform
```

### 2. Backend Setup

#### a. Navigate to backend folder
```bash
cd backend
```

#### b. Create and activate a virtual environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

#### c. Install dependencies
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### d. Create `.env` file
Add the following to `/backend/.env`:
```env
GEMINI_API_KEY=your_api_key_here
DB_URL=sqlite:///./financial_data.db
PORT=8000
```

#### e. Initialize the database
```bash
python init_db.py
```

#### f. Start the backend server
```bash
python app/main.py
```

✅ Verify it runs at [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3. Frontend Setup

#### a. Go to frontend directory
```bash
cd ../frontend
```

#### b. Install dependencies
```bash
npm install
```

#### c. Start the development server
```bash
npm run dev
```

✅ Visit the frontend at [http://localhost:5173](http://localhost:5173)

---

## Setup Method B – Docker (Recommended for Quick Start)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-org>/financial_intelligence_platform.git
cd financial_intelligence_platform
```

### 2. Run Docker Compose
```bash
docker compose up --build
```

### 3. Access the Application
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000/docs](http://localhost:8000/docs)

To stop containers:
```bash
docker compose down
```

---

## Verification

| Check | Description |
|-------|--------------|
| ✅ Backend | `app/main.py` runs without error |
| ✅ Database | `init_db.py` initializes correctly |
| ✅ Frontend | `package.json` exists and runs via `npm run dev` |
| ✅ Docker | `docker-compose.yml` maps ports (8000, 5173) |

---

## Troubleshooting

| Issue | Cause | Solution |
|--------|--------|-----------|
| Port already in use | Another service using same port | Change port in `.env` or `docker-compose.yml` |
| Missing module | Dependency not installed | Run `pip install -r requirements.txt` or `npm install` |
| API key error | Missing/invalid key | Check `.env` file |
| Docker build error | Cache issue | Run `docker compose build --no-cache` |

---

## Verification Plan

### Automated Tests
N/A (Documentation-only task)

### Manual Verification
- Confirm presence of `init_db.py`, `app/main.py`, and `package.json`.
- Confirm Docker ports in `docker-compose.yml`.
- Follow the steps to ensure both backend and frontend start successfully.

---

*End of local_run_guide.md*