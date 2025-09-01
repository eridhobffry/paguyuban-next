import os
import time
import jwt
import httpx


AI_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001").rstrip("/")
TIMEOUT = float(os.getenv("BENCH_TIMEOUT", "2.0"))


def make_token(secret: str) -> str:
    now = int(time.time())
    payload = {
        "iss": "paguyuban-next",
        "aud": "paguyuban-ai",
        "iat": now,
        "exp": now + 60,
        "jti": f"bench-{now}",
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def bench_call(path: str, body: dict, headers: dict) -> tuple[float, int, str]:
    url = f"{AI_URL}{path}"
    started = time.perf_counter()
    with httpx.Client(timeout=TIMEOUT) as client:
        r = client.post(url, json=body, headers=headers)
        dur = (time.perf_counter() - started) * 1000.0
        try:
            txt = r.json()
        except Exception:
            txt = r.text
        return dur, r.status_code, str(txt)[:200]


def main():
    secret = os.getenv("AI_SERVICE_JWT_SECRET") or "dev-secret-ai-service-auth-never-use-in-production"
    token = make_token(secret)
    hdr = {"Authorization": f"Bearer {token}", "X-AI-Model": "qwen25-max"}

    print(f"AI base: {AI_URL} | timeout: {TIMEOUT}s | model: qwen25-max")

    # Indonesian quick chat
    d, s, body = bench_call("/api/event/chat", {"query": "Kapan acara?"}, hdr)
    print(f"/api/event/chat: {d:.1f} ms, status={s}, body={body}")

    # Analytics prompt (deepseek)
    hdr_ds = {**hdr, "X-AI-Model": "deepseek-v3"}
    d2, s2, body2 = bench_call("/api/chat/generate", {"query": "Hitung ROI sponsorship Gold."}, hdr_ds)
    print(f"/api/chat/generate: {d2:.1f} ms, status={s2}, body={body2}")


if __name__ == "__main__":
    main()

