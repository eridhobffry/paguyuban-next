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
        return {"Authorization": f"Bearer {token}", "X-AI-Model": "qwen25-max"}
    return c, _headers


def test_latency_ms_present(client):
    c, headers = client
    resp = c.post("/api/event/chat", json={"query": "Kapan acara?"}, headers=headers())
    assert resp.status_code == 200
    data = resp.json()
    meta = data.get("metadata", {})
    assert isinstance(meta.get("latency_ms"), int)
    assert meta.get("latency_ms") >= 0


def test_memory_diff_disabled(monkeypatch, client):
    # Turn off memory diffs
    monkeypatch.setenv("AI_MEMORY_DIFF", "0")
    c, headers = client
    resp = c.post(
        "/api/event/chat",
        json={"query": "Saya tertarik sponsorship dengan budget €60.000"},
        headers=headers(),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "memory_diff" not in data

