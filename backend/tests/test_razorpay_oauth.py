"""
Unit tests for Razorpay OAuth 2.0 Partner Authorization Code Grant Flow.
"""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_razorpay_oauth_authorize_url_generation():
    response = client.get("/api/oauth/authorize-url?scope=read_write")
    assert response.status_code == 200
    data = response.json()
    assert "https://auth.razorpay.com/authorize" in data["authorization_url"]
    assert "client_id=" in data["authorization_url"]
    assert "response_type=code" in data["authorization_url"]

def test_razorpay_oauth_callback_and_connection_status():
    headers = {"X-User-Role": "FINANCE_CONTROLLER"}
    # Emulate callback code exchange
    response = client.post(
        "/api/oauth/callback",
        headers=headers,
        json={"code": "code_test_auth_12345", "state": "csrf_nexus99_secure"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert token_data["token_type"] == "Bearer"
    assert "access_token" in token_data

    # Check status endpoint
    status_res = client.get("/api/oauth/status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["connected"] is True
    assert status_res.json()["merchant_id"] == "acc_nexus99"
