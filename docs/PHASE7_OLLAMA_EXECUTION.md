# Phase 7 — Ollama Model Execution (Feature-Gated)

This document explains how to enable and test real model inference via Ollama for the AI service, while keeping the existing rule-based fallback and safety intact.

## Overview

- Routing: Next.js decides the model (`X-AI-Model`) based on language/complexity; AI service consumes the hint.
- Execution: AI service (FastAPI) calls Ollama locally when `AI_ENABLE_OLLAMA=1`.
- Fallback: If Ollama is disabled, slow, or errors, the rule-based responses are returned.
- Observability: The service echoes `model_used`, `route_reason`, `cache_status`, and `correlation_id` in `metadata`.
- Memory: `memory_diff` hints (preferences, sponsor interest) are included to be persisted by Next’s memory-policy layer.

## Configuration

Environment variables:

- `AI_ENABLE_OLLAMA=1` — turn on Ollama execution (default off)
- `OLLAMA_BASE_URL` — default `http://localhost:11434`
- `OLLAMA_TIMEOUT_MS` — default `800`
- `OLLAMA_QWEN_TAG` — default `qwen2.5:7b-instruct`
- `OLLAMA_DEEPSEEK_TAG` — default `deepseek-v3:latest`
- `OLLAMA_DEFAULT_TAG` — default `qwen2.5:7b-instruct`
- `AI_SERVICE_JWT_SECRET` — JWT between Next and AI

Headers (sent by Next):

- `X-AI-Model`: `qwen25-max` | `deepseek-v3` (mapped to local tags)
- `X-Intent`, `X-Task-Complexity`, `X-Involves`: routing trace
- `X-Correlation-Id`: trace ID, echoed back in `metadata.correlation_id`

## Files

- `ai/ollama_client.py` — minimal client with `generate()` and `chat()`; maps routing keys to local tags.
- `ai/app.py` — uses Ollama when enabled; otherwise rule-based; always emits `metadata` + `memory_diff`.
- `ai/common/lang.py` — language detection + prompts (ID/MS/DE/EN).
- `ai/common/memory.py` — memory_diff heuristics.

## Tests

Run AI tests locally:

```
python -m pip install -r ai/requirements.txt
cd ai && python -m pytest -q
```

Highlights:
- `tests/test_ollama_integration.py` — mocks Ollama `chat()` for language and analytics paths; verifies fallback on timeout.
- `tests/test_memory_diff.py` — checks sponsor interest and language preferences.
- All tests pass without network access (Ollama calls are mocked).

## Bench (optional)

You can add a quick bench script to time responses with real Ollama:

```
AI_ENABLE_OLLAMA=1 OLLAMA_TIMEOUT_MS=1200 python ai/scripts/bench.py
```

Example implementation idea (`ai/scripts/bench.py`): run two prompts (ID/MS and analytics) and print latency and token estimates.

## Notes on Licensing & Monetization

- Qwen: many checkpoints are open-source with a license that permits commercial usage; verify the specific tag’s license.
- DeepSeek: recent releases include open weight checkpoints; check the exact version’s license terms for commercial use.
- Running via Ollama locally typically incurs no API cost. You can monetize your application as long as you comply with the model’s license.

Always review the license for the exact model tag you deploy.

