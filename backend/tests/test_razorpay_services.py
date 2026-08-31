"""
Unit tests for official Razorpay Services: Route Transfers, Reversals,
Settlements Recon, and Cryptographic HMAC-SHA256 Webhook Verification.
"""

import hmac
import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.razorpay_client import razorpay_client

client = TestClient(app)

def test_razorpay_route_transfer_reversal_api():
    # Test POST /api/razorpay/route/reversals
    headers = {"X-User-Role": "FINANCE_CONTROLLER"}
    payload = {
        "transfer_id": "trf_sample_9921",
        "amount": 150000,
        "reverse_all": True,
        "notes": {"reason": "customer_refund_clawback"}
    }
    response = client.post("/api/razorpay/route/reversals", headers=headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["entity"] == "reversal"
    assert data["transfer_id"] == "trf_sample_9921"
    assert data["amount"] == 150000

def test_razorpay_combined_settlement_recon_api():
    # Test GET /api/razorpay/recon/combined
    headers = {"X-User-Role": "COMPLIANCE_AUDITOR"}
    response = client.get("/api/razorpay/recon/combined?year=2026&month=8&day=31", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["entity"] == "settlement.recon"
    assert len(data["recon_items"]) > 0

def test_razorpay_webhook_hmac_signature_verification():
    # Test POST /api/razorpay/webhooks with valid HMAC-SHA256 signature
    secret = razorpay_client.key_secret
    payload_dict = {
        "event": "refund.processed",
        "payload": {
            "refund": {
                "id": "rfnd_test_001",
                "amount": 50000,
                "payment_id": "pay_test_001"
            }
        }
    }
    body_str = json.dumps(payload_dict)
    valid_signature = hmac.new(
        secret.encode('utf-8'),
        body_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": valid_signature
    }
    response = client.post("/api/razorpay/webhooks", headers=headers, content=body_str)
    assert response.status_code == 200
    assert response.json()["verified"] is True
