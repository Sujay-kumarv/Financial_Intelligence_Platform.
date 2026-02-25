@echo off
echo ============================================================
echo Financial Intelligence Platform - Quick Test
echo ============================================================
echo.

echo [1/2] Testing Ratio Engine (No dependencies required)...
echo.
python test_ratio_engine.py

echo.
echo ============================================================
echo Test Complete!
echo ============================================================
echo.
echo Next Steps:
echo 1. Install dependencies: pip install -r requirements.txt
echo 2. Initialize database: python init_db.py
echo 3. Start API server: python -m app.main
echo 4. Test API: python test_api.py
echo.
pause
