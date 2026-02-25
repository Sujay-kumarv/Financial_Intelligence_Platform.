import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_get_portfolio_summary_rbac(client):
    # Test unauthorized access (Analyst)
    # Mocking the current user as an analyst
    with patch("app.api.v1.users.get_current_user_from_token") as mock_user:
        mock_user.return_value = AsyncMock(role="analyst")
        
        response = client.get("/api/v1/analysis/portfolio/summary")
        assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_portfolio_summary_authorized(client, db_session):
    # Test authorized access (Manager)
    from app.db.models import User
    
    # Create a manager user in test DB
    manager = User(email="mgr@studio.ai", hashed_password="pw", role="manager")
    db_session.add(manager)
    db_session.commit()

    with patch("app.api.v1.users.get_current_user_from_token") as mock_user:
        mock_user.return_value = manager
        
        # We need to ensure some data exists to avoid empty results errors if any
        response = client.get("/api/v1/analysis/portfolio/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_clients" in data
        assert "total_revenue" in data
