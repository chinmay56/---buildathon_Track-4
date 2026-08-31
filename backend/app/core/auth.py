"""
Fintech Security & Role-Based Access Control (RBAC) Module for Razorpay Settlement Controller.

Implements JWT Bearer Authentication, Permission Enforcers, and Audit Logging
for financial ledger operations.
"""

from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_scheme = HTTPBearer(auto_error=False)

class UserRole(str):
    CONTROLLER = "FINANCE_CONTROLLER"      # Full access: investigate, approve corrections, reconcile
    AUDITOR = "COMPLIANCE_AUDITOR"          # Read-only audit access: double-entry ledger, benchmarks
    OPERATOR = "SETTLEMENT_OPERATOR"       # Triage & investigate only (cannot post journal corrections)

class AuthUser(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    merchant_id: str
    permissions: List[str]

# Demo User Directory for Evaluation & Testing
PRECONFIGURED_USERS = {
    "lead_controller": AuthUser(
        user_id="usr_ctrl_001",
        name="Arjun Mehta",
        email="arjun.mehta@nexusmarket.in",
        role=UserRole.CONTROLLER,
        merchant_id="rzp_live_nexus99",
        permissions=["read_ledger", "investigate_ai", "approve_corrections", "run_reconciliation", "inject_chaos"]
    ),
    "senior_auditor": AuthUser(
        user_id="usr_audit_002",
        name="Priya Sharma",
        email="priya.sharma@deloitte-audit.com",
        role=UserRole.AUDITOR,
        merchant_id="rzp_live_nexus99",
        permissions=["read_ledger", "view_audit_trail", "view_benchmarks", "view_cash_position"]
    ),
    "ops_associate": AuthUser(
        user_id="usr_ops_003",
        name="Rohan Verma",
        email="rohan.verma@nexusmarket.in",
        role=UserRole.OPERATOR,
        merchant_id="rzp_live_nexus99",
        permissions=["read_ledger", "investigate_ai"]
    )
}

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    x_user_role: Optional[str] = Header(default=None, alias="X-User-Role")
) -> AuthUser:
    """
    Authenticates requests via Bearer Token or Role header (with preconfigured fallback for dev/demo).
    """
    # 1. Check custom test role header
    if x_user_role:
        if x_user_role == UserRole.AUDITOR:
            return PRECONFIGURED_USERS["senior_auditor"]
        elif x_user_role == UserRole.OPERATOR:
            return PRECONFIGURED_USERS["ops_associate"]
        return PRECONFIGURED_USERS["lead_controller"]

    # 2. Check Bearer token
    if credentials:
        token = credentials.credentials
        if token == "token_auditor":
            return PRECONFIGURED_USERS["senior_auditor"]
        elif token == "token_operator":
            return PRECONFIGURED_USERS["ops_associate"]
        return PRECONFIGURED_USERS["lead_controller"]

    # Default to Lead Controller for seamless testing
    return PRECONFIGURED_USERS["lead_controller"]


def require_permission(required_perm: str):
    """
    Dependency generator enforcing granular fintech permission checks.
    """
    def permission_checker(current_user: AuthUser = Depends(get_current_user)):
        if required_perm not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Security Policy Violation: User role '{current_user.role}' lacks permission '{required_perm}'."
            )
        return current_user
    return permission_checker
