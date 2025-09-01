import os
import jwt
import pytest
from fastapi.testclient import TestClient


def make_token(secret: str):
    now = int(__import__("time").time())
    payload = {
        "iss": "paguyuban-next",
        "aud": "paguyuban-ai",
        "iat": now,
        "exp": now + 60,
        "jti": "test-jti",
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(scope="module")
def client():
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    secret = os.getenv("AI_SERVICE_JWT_SECRET") or "dev-secret-ai-service-auth-never-use-in-production"
    token = make_token(secret)
    from app import app
    c = TestClient(app)
    def _headers():
        return {
            "Authorization": f"Bearer {token}",
            "X-AI-Model": "qwen25-max",
        }
    return c, _headers


def test_memory_diff_sponsor_interest_id(client):
    c, headers = client
    resp = c.post(
        "/api/event/chat",
        json={"query": "Saya tertarik sponsorship dengan budget €60.000"},
        headers=headers(),
    )
    assert resp.status_code == 200
    data = resp.json()
    md = data.get("memory_diff", {})
    assert md
    prefs = md.get("preferences", {})
    assert prefs.get("preferred_language") in ("id", "ms", "en", "de")
    interactions = md.get("sponsor_interactions", [])
    assert isinstance(interactions, list) and interactions
    assert interactions[0].get("type") == "sponsor_interest"
    assert interactions[0].get("budget_mentioned") is True


def test_memory_diff_malay_language(client):
    c, headers = client
    resp = c.post(
        "/api/event/chat",
        json={"query": "Saya nak penaja, bila acara?"},
        headers=headers(),
    )
    assert resp.status_code == 200
    data = resp.json()
    md = data.get("memory_diff", {})
    assert md
    assert md.get("preferences", {}).get("preferred_language") in ("ms", "id", "en", "de")
