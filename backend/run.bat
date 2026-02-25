@echo off
REM Financial Intelligence Platform - Setup and Run Script
echo ============================================================
echo Financial Intelligence Platform - Setup and Run
echo ============================================================
echo.

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)
echo.

echo [Step 1/4] Installing dependencies...
echo This may take a few minutes on first run...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [Step 2/4] Initializing database...
python init_db.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize database
    pause
    exit /b 1
)
echo.

echo [Step 3/4] Starting API server...
echo.
echo ============================================================
echo SERVER STARTING
echo ============================================================
echo API Documentation: http://localhost:8000/api/docs
echo Health Check: http://localhost:8000/api/v1/health
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

python -m app.main
