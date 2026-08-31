"""
Settlement Q&A Copilot API Routes.
"""

from fastapi import APIRouter
from backend.app.agent.copilot import (
    CopilotQueryRequest,
    CopilotQueryResponse,
    answer_settlement_query
)

router = APIRouter(prefix="/api/copilot", tags=["Settlement Q&A Copilot"])


@router.post("/query", response_model=CopilotQueryResponse)
async def query_copilot(req: CopilotQueryRequest):
    """
    Evaluates natural language questions about settlement ledger records,
    cash position, exception root causes, and policy clauses.
    """
    return answer_settlement_query(req)
