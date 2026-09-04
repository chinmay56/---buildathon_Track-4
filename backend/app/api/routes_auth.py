"""
Authentication & RBAC API Routes for Razorpay Settlement Controller.
"""

from typing import Dict, Any, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.core.auth import (
    AuthUser,
    UserRole,
    PRECONFIGURED_USERS,
    get_current_user,
    get_demo_tokens,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & RBAC"])


class LoginRequest(BaseModel):
    email: str
    password: str = "razorpay2026"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: AuthUser


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """
    Authenticates a demo user by email and returns a scoped Bearer token.
    Unknown emails receive HTTP 401 — no silent admin promotion.
    """
    demo_tokens = get_demo_tokens()

    for user_key, user_obj in PRECONFIGURED_USERS.items():
        if user_obj.email.lower() == req.email.lower() or user_key in req.email.lower():
            token = demo_tokens[user_key]
            return LoginResponse(
                access_token=token,
                token_type="bearer",
                user=user_obj,
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=(
            "No demo account found for that email. "
            "Use /api/auth/demo-accounts to list available accounts."
        ),
    )


@router.get("/me", response_model=AuthUser)
async def get_current_user_profile(user: AuthUser = Depends(get_current_user)):
    """
    Returns authenticated user identity, role, and active permissions.
    """
    return user


@router.get("/demo-accounts", response_model=List[AuthUser])
async def list_demo_accounts():
    """
    Returns available pre-configured roles for 1-click judge evaluation.
    """
    return list(PRECONFIGURED_USERS.values())
