# HF Space vs Local Model Routing

This project supports local development with Qwen via Ollama and deployment to Hugging Face Spaces with DeepSeek.

## Environments

- Local (default):
  - `AI_ENABLE_OLLAMA=0`
  - `OLLAMA_DEFAULT_TAG=qwen2.5:7b-instruct`
  - Keep Python responses deterministic; enable Ollama only when needed.

- HF Space:
  - `HF_SPACE=1`
  - `AI_ENABLE_OLLAMA=1`
  - `OLLAMA_DEFAULT_TAG=${OLLAMA_DEEPSEEK_TAG}` (DeepSeek-V3)

See `ai/.env.example` for variables.

## Model Routing

- `MODEL_ROUTING_MODE=auto` lets Next.js choose a model (Qwen for multilingual; DeepSeek for analytics) and hint via `X-AI-Model`.
- Python service uses the hint when `AI_ENABLE_OLLAMA=1`; otherwise falls back to deterministic templates.

## Space-Ready Instructions

1) In HF Space secrets, set:
   - `HF_SPACE=1`
   - `AI_ENABLE_OLLAMA=1`
   - `OLLAMA_DEEPSEEK_TAG=deepseek-v3:latest`
   - `OLLAMA_QWEN_TAG=qwen2.5:7b-instruct`
   - `OLLAMA_DEFAULT_TAG=${OLLAMA_DEEPSEEK_TAG}`
   - `AI_SERVICE_JWT_SECRET=<random-32+ bytes>`

2) Ensure the container has Ollama + models pulled or baked in.

3) Verify health: `GET /health` returns `healthy` with `endpoints` listed.

## Checkpoint Summary (2025-09-04)

- Python AI consumes `context_data.event_context` (sponsors/tiers) for pricing and event Q&A.
- `/api/chat/generate` (Next.js) fetches `event-context` + `analytics-context` and passes `context_data` to Python.
- Knowledge overlay route exposes `debug_shape` with `?debug=shape` to validate merged overlay keys.
- Next health route pings AI and data endpoints; returns `healthy|degraded`.

