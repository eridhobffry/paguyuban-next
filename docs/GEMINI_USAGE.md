## Gemini Usage and Billing Notes

This project uses Google Gemini server-side in three places. Keep this doc updated for usage/billing awareness.

### Where Gemini is used

1. Assistant replies

- File: `src/lib/gemini.ts` → `PaguyubanChatService.chat()`
- How it’s called: via server API `POST /api/chat/generate` (file: `src/app/api/chat/generate/route.ts`), which invokes `paguyubanChat.chat()` on the server.
- Frequency: once per user message in the chat widget.

2. Chat summaries (topics + sentiment)

- File: `src/app/api/analytics/chat/summary/route.ts` → `generateSummary()`
- Trigger: when chat closes (and also on `pagehide`) in `ChatAssistantSection`.
- Frequency: typically 1 per chat session (per tab), not per message.

3. Recommended actions + 360 journey

- File: `src/app/api/admin/analytics/chat/recommend/route.ts`
- Trigger: admin-only “Recommend actions” button in `/admin/analytics` (Recent Chat Summaries section).
- Frequency: on-demand by admins; not automatic.

### Environment

- `GEMINI_API_KEY` (server-only). Required for live model output.
- If the key is missing/invalid, the summary route falls back to a heuristic summary; the recommend route will error; assistant replies will fail. No client key is ever exposed.

### Expected volumes (for billing estimation)

- Assistant replies: up to N calls ≈ number of user chat turns.
- Summaries: ~1 call per chat session (per close/pagehide).
- Recommend actions: ad hoc by admins (low volume).

### Notes and controls

- All calls are made on the server (no client-side model usage).
- To reduce costs: consider sampling chat replies (e.g., gate the chat widget), or skip summaries for very short transcripts.
- PII: chat text is user-provided; avoid injecting sensitive data; summaries are stored in `chatbot_summaries`.

### Files and endpoints (quick links)

- `src/lib/gemini.ts` (core client)
- `src/app/api/chat/generate/route.ts` (assistant replies)
- `src/app/api/analytics/chat/summary/route.ts` (summaries)
- `src/app/api/admin/analytics/chat/recommend/route.ts` (recommendations)
- UI trigger: `src/components/sections/ChatAssistantSection.tsx` (summary dispatch)
- Admin UI: `src/app/admin/analytics/page.tsx` (recommend button)
