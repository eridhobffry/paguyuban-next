import { z } from "zod";

const TextOnly = z.object({
  result: z.string().optional(),
  response: z.string().optional(),
});

export function parseAiTextResponse(json: unknown): string | null {
  const parsed = TextOnly.safeParse(json);
  if (!parsed.success) return null;
  const data = parsed.data;
  const text = data.result ?? data.response ?? null;
  return typeof text === "string" ? text : null;
}

