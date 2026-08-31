"""
Unit tests for Supabase Cloud Database Configuration and Sync Adapter.
"""

from backend.app.db.supabase_client import supabase_client

def test_supabase_client_is_configured():
    assert supabase_client.is_configured() is True
    assert "https://kxcmgqpglcyjcgdmblkx.supabase.co" in supabase_client.url
    assert len(supabase_client.key) > 20
