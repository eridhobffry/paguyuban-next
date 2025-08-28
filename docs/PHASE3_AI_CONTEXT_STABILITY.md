# Phase 3 — AI Context Stability & Test Reliability (Implemented)

This phase hardens the AI data-context APIs and their unit tests to ensure reliability, remove Vitest hoisting traps, and prevent runtime validation errors.

## See also

- Endpoint contracts and Neon mappings: [PHASE3_DATA_ENDPOINTS.md](./PHASE3_DATA_ENDPOINTS.md)

## What’s included

- **Vitest hoisting fixes**
  - Removed `require()` calls inside `vi.mock()` factories
  - Centralized shared references with `vi.hoisted()` (e.g., cache `getCached` mock)
  - Prevents "Cannot access X before initialization" errors
- **Cache mock refactor**
  - Tests now mock `@/lib/cache` by returning a hoisted `getCachedMock`
  - Preserves original call-through semantics (provider executed when cache miss)
- **Zod validation robustness**
  - `analytics-context` normalizes URLSearchParams `null` → `undefined` before schema parsing
  - Eliminates 500s from optional fields receiving `null`
- **No behavior regressions**
  - Cache headers and route outputs preserved; tests cover expected structure

## Affected files

- `src/app/api/ai/data/analytics-context/route.ts`
  - Coerce `searchParams.get(...)` `null` → `undefined` for optional fields
- `tests/api/ai_chat_context_route.test.ts`
  - Use `vi.hoisted()` for `getCachedMock`; update `vi.mock("@/lib/cache")`
- `tests/api/ai_event_context_route.test.ts`
  - Same hoisted cache mock pattern; updated assertions

## Outcomes

- All targeted suites pass:
  - `tests/api/ai_analytics_context_route.test.ts`
  - `tests/api/ai_chat_context_route.test.ts`
  - `tests/api/ai_event_context_route.test.ts`
- Resolved Vitest hoisting errors and Zod runtime validation errors
- Maintained existing cache behavior and response schemas

## How to test

- Run only the affected suites:

```bash
npm run -s test:unit:run -- \
  tests/api/ai_event_context_route.test.ts \
  tests/api/ai_chat_context_route.test.ts \
  tests/api/ai_analytics_context_route.test.ts
```

- Or run all unit tests:

```bash
vitest run
```

## Design notes

- **Use `vi.hoisted()`** for any shared mutable references used across mocks and tests
- **Never call `require()` inside `vi.mock()` factories**; import/define at module scope or hoist
- **Normalize optional query params** from URLSearchParams before Zod parsing

## Next steps (optional)

- Tighten test typings (reduce `any` in test files)
- Add additional coverage for edge cases and cache behavior
