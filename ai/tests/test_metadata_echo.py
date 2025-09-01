import os
import jwt
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


def test_metadata_echo_headers():
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    secret = os.getenv("AI_SERVICE_JWT_SECRET") or "dev-secret-ai-service-auth-never-use-in-production"
    token = make_token(secret)
    from app import app
    c = TestClient(app)
    headers = {
        "Authorization": f"Bearer {token}",
        "X-AI-Model": "qwen25-max",
        "X-Route-Reason": "multilingual",
        "X-Cache": "HIT",
        "X-Intent": "event_timing",
        "X-Task-Complexity": "low",
        "X-Involves": "",
        "X-Correlation-Id": "test-corr-123",
    }
    resp = c.post("/api/event/chat", json={"query": "Kapan acara?"}, headers=headers)
    assert resp.status_code == 200
    meta = resp.json().get("metadata", {})
    assert meta.get("model_used") == "qwen25-max"
    assert meta.get("route_reason") == "multilingual"
    assert meta.get("cache_status") == "HIT"
    assert meta.get("client_intent") == "event_timing"
    assert meta.get("task_complexity") == "low"
    assert meta.get("involves") == ""
    assert meta.get("correlation_id") == "test-corr-123"
    assert isinstance(meta.get("latency_ms"), int)

