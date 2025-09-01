"""
Thin Ollama client for local model inference (feature-gated).
"""
from typing import Any, Dict, List, Optional
import httpx
import os


DEFAULT_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")


class OllamaError(RuntimeError):
    pass


class OllamaClient:
    def __init__(self, base_url: Optional[str] = None, timeout_ms: int = 800):
        self.base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self.timeout = timeout_ms / 1000.0

    def _post(self, path: str, json: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                r = client.post(url, json=json)
                if r.status_code >= 400:
                    raise OllamaError(f"ollama_{r.status_code}")
                return r.json()
        except httpx.TimeoutException as e:
            raise TimeoutError("ollama_timeout") from e
        except Exception as e:
            raise OllamaError(str(e))

    def generate(
        self,
        model: str,
        prompt: str,
        system: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        payload: Dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "stream": False,
        }
        if system:
            payload["system"] = system
        if options:
            payload["options"] = options
        data = self._post("/api/generate", payload)
        return str(data.get("response", ""))

    def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
        }
        if options:
            payload["options"] = options
        data = self._post("/api/chat", payload)
        # response format: { message: { role, content }, ... }
        msg = data.get("message") or {}
        return str(msg.get("content", ""))


def map_model(header_model: Optional[str]) -> str:
    """Map routing key to local Ollama tag."""
    key = (header_model or "").lower()
    if key.startswith("deepseek"):
        return os.getenv("OLLAMA_DEEPSEEK_TAG", "deepseek-v3:latest")
    if key.startswith("qwen"):
        return os.getenv("OLLAMA_QWEN_TAG", "qwen2.5:7b-instruct")
    # default fallback
    return os.getenv("OLLAMA_DEFAULT_TAG", "qwen2.5:7b-instruct")

