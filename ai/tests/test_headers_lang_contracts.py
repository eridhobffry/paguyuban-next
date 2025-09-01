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
    # Ensure import path is ai/
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # Prefer dev secret path in app if AI_SERVICE_JWT_SECRET not set
    secret = os.getenv("AI_SERVICE_JWT_SECRET") or "dev-secret-ai-service-auth-never-use-in-production"
    token = make_token(secret)

    from app import app
    c = TestClient(app)

    def _headers(extra=None):
        h = {
            "Authorization": f"Bearer {token}",
            "X-AI-Model": "qwen25-max",
            "X-Route-Reason": "multilingual_or_localization",
            "X-Cache": "MISS",
            "X-Intent": "event_timing",
            "X-Task-Complexity": "low",
            "X-Involves": "",
        }
        if extra:
            h.update(extra)
        return h

    return c, _headers


def test_header_echo_and_malay_language(client):
    c, headers = client
    # Malay query: "Bila acara diadakan?"
    resp = c.post("/api/event/chat", json={"query": "Bila acara diadakan?"}, headers=headers())
    assert resp.status_code == 200
    data = resp.json()
    # Expect Malay or Indonesian phrasing; allow both for leniency
    text = data.get("result", "").lower()
    assert any(x in text for x in ["akan diadakan", "diadakan pada"])  # ms/id phrase
    meta = data.get("metadata", {})
    assert meta.get("model_used") == "qwen25-max"
    assert meta.get("route_reason") == "multilingual_or_localization"
    assert meta.get("cache_status") == "MISS"
    assert meta.get("client_intent") == "event_timing"
    assert meta.get("task_complexity") == "low"


def test_contract_endpoints(client):
    c, headers = client
    r1 = c.post("/api/contracts/event-plan", json={}, headers=headers())
    assert r1.status_code == 200
    body = r1.json()
    assert "event_plan" in body and isinstance(body["event_plan"], dict)
    for k in ["title", "date_range", "city", "personas", "goals", "budget_band", "risks", "sponsor_targets", "next_actions"]:
        assert k in body["event_plan"]

    r2 = c.post("/api/contracts/analytics-report", json={"question": "How is ROI?"}, headers=headers())
    assert r2.status_code == 200
    assert "analytics_report" in r2.json()

    r3 = c.post("/api/contracts/contract-review", json={"doc_title": "Test"}, headers=headers())
    assert r3.status_code == 200
    payload = r3.json()["contract_review"]
    assert payload["doc_title"] == "Test"

