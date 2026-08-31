"""
Unit tests for RBAC security and role permissions in financial ledger closures.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_controller_can_approve_correction():
    # Controller has 'approve_corrections' permission
    headers = {"X-User-Role": "FINANCE_CONTROLLER"}
    response = client.post("/api/exceptions/EXC_RC_ord_0010/approve", headers=headers, json={"approved_by": "Arjun Mehta"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_auditor_cannot_approve_correction():
    # Auditor is strictly read-only and lacks 'approve_corrections' permission
    headers = {"X-User-Role": "COMPLIANCE_AUDITOR"}
    response = client.post("/api/exceptions/EXC_RC_ord_0011/approve", headers=headers, json={"approved_by": "Priya Sharma"})
    assert response.status_code == 403
    assert "Security Policy Violation" in response.json()["detail"]

def test_auth_me_returns_active_permissions():
    headers = {"X-User-Role": "FINANCE_CONTROLLER"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "FINANCE_CONTROLLER"
    assert "approve_corrections" in data["permissions"]
