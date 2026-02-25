import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_e2e_onboarding_to_portfolio(client, db_session):
    # 1. Create a Manager User
    from app.db.models import User
    manager = User(email="admin@studio.ai", hashed_password="pw", role="admin")
    db_session.add(manager)
    db_session.commit()

    with patch("app.api.v1.users.get_current_user_from_token") as mock_user:
        mock_user.return_value = manager

        # 2. Register a new company via API
        company_data = {
            "name": "Integration Test Corp",
            "industry": "Finance",
            "ticker_symbol": "ITC",
            "fiscal_year_end": "Dec"
        }
        resp = client.post("/api/v1/companies/", json=company_data)
        assert resp.status_code == 201
        company_id = resp.json()["id"]

        # 3. Add a financial statement (simplified)
        from app.db.models import FinancialStatement
        stmt = FinancialStatement(
            company_id=company_id,
            period_end="2025-12-31",
            raw_data={"income_statement": {"revenue": 5000000}}
        )
        db_session.add(stmt)
        db_session.commit()

        # 4. Verify Portfolio Summary reflects the new data
        resp = client.get("/api/v1/analysis/portfolio/summary")
        assert resp.status_code == 200
        summary = resp.json()
        assert summary["total_clients"] >= 1
        assert summary["total_revenue"] >= 5000000
