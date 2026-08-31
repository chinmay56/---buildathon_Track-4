"""
Supabase Cloud Storage & Database Sync Adapter.

Enables cloud synchronization for settlement ledger records, audit trails,
and investigation exceptions using the Supabase REST API and Client.
"""

import os
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://kxcmgqpglcyjcgdmblkx.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")


class SupabaseSyncClient:
    def __init__(self, url: str = SUPABASE_URL, key: str = SUPABASE_ANON_KEY):
        self.url = url.rstrip("/")
        self.key = key
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

    def is_configured(self) -> bool:
        return bool(self.url and self.key)

    def sync_settlement_record(self, record: Dict[str, Any]) -> bool:
        """
        Syncs a single settlement record to the Supabase cloud table.
        """
        if not self.is_configured():
            return False
        try:
            endpoint = f"{self.url}/rest/v1/settlement_records"
            resp = requests.post(endpoint, json=record, headers=self.headers, timeout=3)
            return resp.status_code in (200, 201)
        except Exception:
            return False

    def sync_audit_log(self, exception_id: str, action: str, details: Dict[str, Any]) -> bool:
        """
        Syncs an audit trail log to Supabase for compliance inspection.
        """
        if not self.is_configured():
            return False
        try:
            payload = {
                "exception_id": exception_id,
                "action": action,
                "details": details,
                "timestamp": datetime.utcnow().isoformat()
            }
            endpoint = f"{self.url}/rest/v1/audit_logs"
            resp = requests.post(endpoint, json=payload, headers=self.headers, timeout=3)
            return resp.status_code in (200, 201)
        except Exception:
            return False


supabase_client = SupabaseSyncClient()
