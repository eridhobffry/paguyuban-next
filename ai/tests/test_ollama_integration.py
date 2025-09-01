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


@pytest.fixture(autouse=True)
def enable_ollama_env(monkeypatch):
    monkeypatch.setenv("AI_ENABLE_OLLAMA", "1")
    monkeypatch.setenv("OLLAMA_TIMEOUT_MS", "200")
    yield


@pytest.fixture(scope="module")
def client():
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # Ensure env is set before importing app module
    os.environ["AI_ENABLE_OLLAMA"] = "1"
    os.environ["OLLAMA_TIMEOUT_MS"] = "200"
    secret = os.getenv("AI_SERVICE_JWT_SECRET") or "dev-secret-ai-service-auth-never-use-in-production"
    token = make_token(secret)
    from app import app
    c = TestClient(app)
    def _headers(model: str = "qwen25-max"):
        return {
            "Authorization": f"Bearer {token}",
            "X-AI-Model": model,
        }
    return c, _headers


def test_ollama_chat_language(monkeypatch, client):
    # Mock OllamaClient.chat
    from ollama_client import OllamaClient
    def mock_chat(self, model, messages, options=None):
        return "Halo! Ini jawaban singkat."
    monkeypatch.setattr(OllamaClient, "chat", mock_chat)

    c, headers = client
    resp = c.post("/api/event/chat", json={"query": "Kapan acara?"}, headers=headers("qwen25-max"))
    assert resp.status_code == 200
    body = resp.json()
    assert "Halo" in body.get("result", "")
    assert body.get("metadata", {}).get("model_used") == "qwen25-max"


def test_ollama_analytics_fallback_on_timeout(monkeypatch, client):
    # Simulate timeout -> fallback to rule-based
    from ollama_client import OllamaClient
    def mock_chat(self, model, messages, options=None):
        raise TimeoutError("ollama_timeout")
    monkeypatch.setattr(OllamaClient, "chat", mock_chat)

    c, headers = client
    resp = c.post("/api/chat/generate", json={"query": "Hitung ROI dan optimasi jadwal."}, headers=headers("deepseek-v3"))
    assert resp.status_code == 200
    body = resp.json()
    # Fallback should still produce a non-empty result
    assert isinstance(body.get("result"), str) and len(body["result"]) > 0
    assert body.get("metadata", {}).get("model_used") == "deepseek-v3"
