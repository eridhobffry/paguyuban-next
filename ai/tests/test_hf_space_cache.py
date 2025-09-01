import pytest
import asyncio


class FakeResponse:
    def __init__(self, status: int, data: dict):
        self.status = status
        self._data = data

    async def json(self):
        return self._data


class FakeCM:
    def __init__(self, resp: FakeResponse):
        self.resp = resp

    async def __aenter__(self):
        return self.resp

    async def __aexit__(self, exc_type, exc, tb):
        return False


class FakeSession:
    def __init__(self):
        self.calls = 0

    def get(self, url: str, params=None):
        self.calls += 1
        return FakeCM(FakeResponse(200, {"ok": True, "call": self.calls}))


@pytest.mark.asyncio
async def test_hf_space_api_client_cache(monkeypatch):
    from hf_space.api_mediated_agents import APIClient

    api = APIClient(base_url="https://example.test")
    fake = FakeSession()

    async def patched_get_session(self):
        return fake

    monkeypatch.setattr(APIClient, "get_session", patched_get_session)
    api.cache_ttl = 60

    # First call triggers network
    data1 = await api.get("/api/ai/data/event-context", {"intent": "event_details"})
    assert data1["ok"] is True
    assert fake.calls == 1

    # Second call within TTL should hit cache
    data2 = await api.get("/api/ai/data/event-context", {"intent": "event_details"})
    assert data2 == data1
    assert fake.calls == 1

