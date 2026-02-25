import pytest
from fastapi import HTTPException
from app.api.v1.permissions import RoleChecker
from unittest.mock import MagicMock

def test_role_checker_success():
    checker = RoleChecker(["admin", "manager"])
    mock_user = MagicMock()
    mock_user.role = "manager"
    
    # SHould not raise
    result = checker(user=mock_user)
    assert result == mock_user

def test_role_checker_failure():
    checker = RoleChecker(["admin"])
    mock_user = MagicMock()
    mock_user.role = "analyst"
    
    with pytest.raises(HTTPException) as excinfo:
        checker(user=mock_user)
    
    assert excinfo.value.status_code == 403
    assert "sufficient permissions" in excinfo.value.detail
