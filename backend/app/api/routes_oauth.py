"""
Razorpay OAuth 2.0 API Routes.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.services.razorpay_oauth import razorpay_oauth_service, RazorpayOAuthToken
from backend.app.core.auth import AuthUser, require_permission, get_current_user

router = APIRouter(prefix="/api/oauth", tags=["Razorpay OAuth 2.0"])


class OAuthCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = "csrf_nexus99_secure"
    redirect_uri: Optional[str] = "http://localhost:5173/oauth/callback"


@router.get("/authorize-url")
def get_razorpay_oauth_url(
    redirect_uri: str = "http://localhost:5173/oauth/callback",
    scope: str = "read_write"
):
    """
    Returns official Razorpay OAuth 2.0 authorization URL.
    """
    url = razorpay_oauth_service.generate_authorization_url(
        redirect_uri=redirect_uri,
        scope=scope
    )
    return {
        "authorization_url": url,
        "client_id": razorpay_oauth_service.client_id,
        "scope": scope
    }


@router.post("/callback", response_model=RazorpayOAuthToken)
def handle_oauth_callback(
    payload: OAuthCallbackRequest,
    user: AuthUser = Depends(require_permission("run_reconciliation"))
):
    """
    Exchanges OAuth authorization code for Razorpay live partner tokens.
    """
    token = razorpay_oauth_service.exchange_code_for_token(
        code=payload.code,
        redirect_uri=payload.redirect_uri or "http://localhost:5173/oauth/callback"
    )
    return token


@router.get("/status")
def get_oauth_connection_status(user: AuthUser = Depends(get_current_user)):
    """
    Returns active Razorpay OAuth merchant connection status.
    """
    return razorpay_oauth_service.get_connection_status()


@router.post("/disconnect")
def disconnect_razorpay_oauth(user: AuthUser = Depends(require_permission("approve_corrections"))):
    """
    Disconnects Razorpay OAuth connection.
    """
    return razorpay_oauth_service.disconnect_account()
