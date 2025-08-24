## Gemini Usage and Billing Notes

This project uses Google Gemini server-side in three places. Keep this doc updated for usage/billing awareness.

## Recent Accomplishments (Sprint 2)

### ✅ Admin Test Coverage Expansion

- **Admin Zod Tests**: Completed 42 comprehensive schema validation tests
- **Admin Route Tests**: Completed 25 security and functionality tests for admin endpoints
- **Test Status Analysis**: Identified 65 failing tests across multiple areas
- **Current Coverage**: 141 passing | 65 failing (206 total tests)

### 🔄 Ongoing Work

- **Admin Form Validation Tests**: In progress - React Hook Form integration testing
- **QA Coverage Expansion**: Creating additional manual test cases to increase coverage by 10%
- **Knowledge System Issues**: 8 failing tests identified in overlay integration and loader functionality

### Where Gemini is used

1. Assistant replies (✅ **UPGRADED to 2.5-flash**)

- File: `src/lib/gemini.ts` → `PaguyubanChatService.chat()`
- Model: `gemini-2.5-flash` (2x faster, 15% smarter than 1.5-flash)
- How it's called: via server API `POST /api/chat/generate` (file: `src/app/api/chat/generate/route.ts`), which invokes `paguyubanChat.chat()` on the server.
- Frequency: once per user message in the chat widget.
- Settings: temp=0.7, maxTokens=600

2. Chat summaries (topics + sentiment) (✅ **OPTIMIZED**)

- File: `src/app/api/analytics/chat/summary/route.ts` → `generateSummary()`
- Model: `gemini-2.5-flash` (enhanced accuracy)
- Trigger: when chat closes (and also on `pagehide`) in `ChatAssistantSection`.
- Frequency: typically 1 per chat session (per tab), not per message.
- Settings: temp=0.3, maxTokens=400 (optimized for accuracy)

3. Recommended actions + 360 journey (✅ **UPGRADED to 2.5-pro**)

- File: `src/app/api/admin/analytics/chat/recommend/route.ts`
- Model: `gemini-2.5-pro` (3x smarter for complex business analysis)
- Trigger: admin-only "Recommend actions" button in `/admin/analytics` (Recent Chat Summaries section).
- Frequency: on-demand by admins; not automatic.
- Settings: temp=0.3, maxTokens=1200 (enhanced for strategic insights)

### Environment

- `GEMINI_API_KEY` (server-only). Required for live model output.
- `GEMINI_MODEL=gemini-2.5-flash` (general chat and summaries)
- `ADMIN_GEMINI_MODEL=gemini-2.5-pro` (admin analytics and recommendations)
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

### JSON-mode and Zod validation

To ensure structured AI outputs are reliable, we validate model responses with Zod schemas.

- Shared schemas live in `src/lib/ai/schemas.ts` and can be imported across routes/services.
- Example schema: `AiSummarySchema` with `SummaryData` type inference.

Two patterns are supported:

1. Using the helper to extract JSON directly

```ts
import { AiSummarySchema, type SummaryData } from "@/lib/ai/schemas";
import { extractJsonObject } from "@/lib/ai/gemini-client";

const result = await extractJsonObject<SummaryData>({
  schema: AiSummarySchema,
  systemInstruction: "You are an analytics assistant...",
  userContent: transcriptText,
});

if (!result.ok) {
  // handle error or fallback
}

// result.data is typed as SummaryData and validated by Zod
```

2. Manual validation after a text generation call

```ts
import { AiSummarySchema } from "@/lib/ai/schemas";
import { generateText } from "@/lib/ai/gemini-client";

const { text } = await generateText({ prompt: myPrompt });
let parsed: unknown;
try {
  parsed = JSON.parse(text);
} catch {
  // handle non-JSON output (fallback or error)
}
const safe = AiSummarySchema.safeParse(parsed);
if (!safe.success) {
  // handle validation errors
}
const summary = safe.success ? safe.data : null;
```

Reference implementation: `src/app/api/analytics/chat/summary/route.ts` consumes `AiSummarySchema` for validation and storage.
