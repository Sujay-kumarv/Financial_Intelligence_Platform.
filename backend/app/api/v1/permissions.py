from fastapi import HTTPException, status, Depends
from typing import List
from app.api.v1.auth_deps import get_current_user_from_token
from app.db.models import User

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user_from_token)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{user.role}' does not have sufficient permissions. Allowed roles: {self.allowed_roles}"
            )
        return user

# Convenience instances
is_admin = RoleChecker(["admin"])
is_manager_or_admin = RoleChecker(["manager", "admin"])
is_analyst_or_above = RoleChecker(["analyst", "manager", "admin"])
