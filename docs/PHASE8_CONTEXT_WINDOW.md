# Phase 8: AI Context Window, Summarization, and Redaction

This document explains the Phase 8 additions that improve prompt construction and safety for the Paguyuban Messe chat assistant.

- Location of chat service: `src/lib/gemini.ts` (`PaguyubanChatService`)
- Context utilities:
  - Window assembly: `src/lib/ai/context/window.ts`
  - Summarization: `src/lib/ai/context/summarize.ts`
  - Redaction: `src/lib/ai/context/redact.ts`

## Goals

- Efficiently pack relevant context into model prompts under a token budget.
- Preserve useful continuity by compacting prior turns deterministically.
- Reduce leakage of sensitive strings (emails, phone numbers, tokens, long hex secrets) via simple redaction heuristics.

## What’s integrated

The chat pipeline in `PaguyubanChatService.chat()` now:

1. Detects topic/intent and language preferences as before.
2. Builds context chunks:
   - `system`: selected assistant’s system prompt (essential)
   - `overlay`: topic-specific knowledge snippet (essential)
   - `current`: the current user message (essential)
   - `history`: the recent conversation history (last 8 messages)
3. Assembles chunks within a model budget using `assembleContext()`.
4. Creates a compact continuity summary using `summarizeTurns()`.
5. Composes the final prompt including:
   - Specific topic context
   - Assembled context (ordered, budgeted)
   - Summarized history
   - Current user message + language + topic
6. Applies `redact()` over the composed prompt to mask sensitive patterns.
7. Calls the centralized Gemini client (`src/lib/ai/gemini-client.ts`).

The rest of the flow (fallbacks, function-call resolution, metadata, history maintenance) remains unchanged.

## APIs and key options

### `assembleContext(input, options)` (window)
- Input groups: `system`, `policy`, `current`, `overlays`, `tools`, `history`
- `ContextChunk` fields:
  - `role`: `"system" | "policy" | "user" | "assistant" | "tool" | "overlay"`
  - `content`: string
  - `timestamp?`: ms epoch used for recency ordering
  - `essential?`: mark as never-drop unless over budget
  - `priority?`: numeric override for ordering
- Options:
  - `maxTokens`: model context capacity
  - `headroomRatio`: keep a margin (default 0.1)
  - `tokenEstimator`: overrideable token estimator (default ~4 chars/token)

Internally, chunks are sorted by priority and timestamp. Essentials are included first; remaining chunks are added until budget is reached. If essentials alone overflow, lowest-priority essentials are removed last-resort.

### `summarizeTurns(turns, tokenBudget, options)` (summarize)
- Returns compacted text of recent turns with `[…]` prefixes, deterministic and simple.
- `tokenEstimator` can be passed for consistency with window assembly.
- Uses sentence-aware slicing and a binary-search fallback for tight budgets.

### `redact(text, rules?)` (redact)
- Defaults to masking the following categories:
  - `email`, `phone` (>=7 digits), `token` (JWT-like), `secret` (>=32 hex chars)
- `rules.enabled` can toggle categories, and `rules.allowlist` can preserve exact values.
- Returns `{ text, stats }` for optional telemetry.

## How it’s used in `PaguyubanChatService`

See `src/lib/gemini.ts` in the `chat()` method around these areas:

- Context build and import statements near the top of the file.
- Assembly and summary around the prompt composition.
- Redaction applied immediately before sending to Gemini.

Prompt sections now include:

```
SPECIFIC CONTEXT FOR THIS QUERY:
<topicContext>

ASSEMBLED CONTEXT:
<ordered chunks excluding system>

SUMMARIZED HISTORY:
<compact turns>

USER MESSAGE: <message>
USER LANGUAGE PREFERENCE: <language>
DETECTED TOPIC: <topic>
```

## Tuning guidance

- Headroom: Start with `headroomRatio = 0.1` to avoid near-limit truncation from providers.
- Max tokens: Adjust `maxTokens` to your model’s context capacity (sum of prompt + output).
- History window: Increase/decrease `history.slice(-N)` to bias more/less continuity.
- Summary budget: `summarizeTurns(..., 400)` is a practical default; tweak per model size.
- Priorities and essentials: Mark `system`, `overlay`, and `current` as `essential`; raise priorities for critical overlays or tools if you add more context sources.

## Redaction configuration (optional)

By default, all categories are enabled. For future customization, you can:
- Wire environment variables like `AI_REDACT_EMAIL=true`, `AI_REDACT_ALLOWLIST="press@site.com;+49 123 4567"`.
- Provide a redaction `rules` object at call-sites when needed (e.g., admin tools versus public endpoints).

A follow-up task will expose configuration hooks; see TODO `next-context-redaction-config`.

## Testing

Targeted unit tests:

```bash
# AI context utilities + chat service internals
npm run -s test:unit:run -- tests/lib/ai/context/*.test.ts tests/lib/paguyuban_chat_service.test.ts
```

All Phase 8 context tests currently pass in CI and locally. Full suite may include unrelated failures tracked elsewhere.

## Troubleshooting

- If you see empty model responses, the chat pipeline already falls back to a local knowledge response.
- If prompts seem too long, reduce `history` depth and/or lower `maxTokens` or raise `headroomRatio`.
- If useful details are being redacted, add them to `allowlist` (temporary) or adjust `enabled` flags per environment.

## Future work

- Redaction rules configurability via env and per-call options.
- Tool outputs and knowledge overlays as first-class chunk types with fine-grained priorities.
- Telemetry: record redaction stats and context sizes to tune defaults over time.
