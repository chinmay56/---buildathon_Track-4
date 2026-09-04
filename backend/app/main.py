import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes_auth import router as auth_router
from backend.app.api.routes_oauth import router as oauth_router
from backend.app.api.routes_razorpay import router as razorpay_services_router
from backend.app.api.routes_reconciliation import router as reconciliation_router
from backend.app.api.routes_exceptions import router as exceptions_router
from backend.app.api.routes_actions import router as actions_router
from backend.app.api.routes_chaos import router as chaos_router
from backend.app.api.routes_benchmark import router as benchmark_router
from backend.app.api.routes_cash import router as cash_router
from backend.app.api.routes_copilot import router as copilot_router
from backend.app.db.init_db import init_db
from backend.app.state import app_state


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQL database schema — app_state seeds data in its own __init__
    init_db()
    yield


app = FastAPI(
    title="Razorpay Route • Settlement Controller API",
    description="Autonomous AI Finance Controller utilizing official Razorpay OAuth 2.0, Route, Reversals, Settlement Recon, and SQLAlchemy ORM (Track 04)",
    version="2.4.0",
    lifespan=lifespan
)

# Allow requests only from the known frontend origins.
# "allow_credentials=True" requires an explicit origin list — wildcard is not permitted.
_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-User-Role"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(razorpay_services_router)
app.include_router(reconciliation_router)
app.include_router(exceptions_router)
app.include_router(actions_router)
app.include_router(chaos_router)
app.include_router(benchmark_router)
app.include_router(cash_router)
app.include_router(copilot_router)


@app.get("/")
def root():
    return {
        "service": "Razorpay Settlement Controller",
        "track": "Track 04 - AI Finance Controller",
        "status": "online",
        "version": "2.4.0",
        "database": "SQLAlchemy ORM (SQLite WAL / PostgreSQL)",
        "oauth_2_0_supported": True,
        "razorpay_services_integrated": [
            "Razorpay OAuth 2.0 Partner Flow (https://auth.razorpay.com/authorize)",
            "Razorpay Route Transfers API (/v1/payments/:id/transfers)",
            "Razorpay Route Reversals API (/v1/transfers/:id/reversals)",
            "Razorpay Combined Settlement Recon API (/v1/settlements/recon/combined)",
            "Razorpay Webhooks with HMAC-SHA256 Signature Verification",
            "Official razorpay-python SDK v2.0.1"
        ],
        "batch_records_loaded": len(app_state.orders)
    }
