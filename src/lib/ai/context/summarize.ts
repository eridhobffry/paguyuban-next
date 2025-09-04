import type { ContextChunk } from "./window";
import { estimateTokens } from "./window";

export interface CompactOptions {
  tokenEstimator?: (text: string) => number;
  sentenceSeparator?: RegExp; // used to split sentences
  charsPerToken?: number; // fallback scaling, default 4
}

/**
 * A simple heuristic summarizer that compacts whitespace and trims sentences
 * until the token budget is satisfied. Appends an ellipsis when truncated.
 */
export function compactText(
  text: string,
  tokenBudget: number,
  options: CompactOptions = {}
): { text: string; truncated: boolean } {
  const estimator = options.tokenEstimator ?? estimateTokens;
  const sep = options.sentenceSeparator ?? /(?<=[.!?])\s+/;
  const cpt = options.charsPerToken ?? 4;

  function sliceToBudget(s: string, budget: number): string {
    if (budget <= 0) return "";
    // Binary search on character length to meet estimator budget
    let lo = 0;
    let hi = s.length;
    let best = "";
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const candidate = s.slice(0, mid);
      if (estimator(candidate) <= budget) {
        best = candidate;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return best;
  }

  const normalized = (text ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return { text: "", truncated: false };

  if (estimator(normalized) <= tokenBudget) {
    return { text: normalized, truncated: false };
  }

  const sentences = normalized.split(sep);
  const kept: string[] = [];

  for (const s of sentences) {
    const candidate = kept.length === 0 ? s : `${kept.join(" ")} ${s}`;
    const t = estimator(candidate);
    if (t <= tokenBudget) {
      kept.push(s);
    } else {
      break;
    }
  }

  // If nothing fits, hard cut by characters based on a rough 4-char per token heuristic
  if (kept.length === 0) {
    // First try estimator-constrained slice
    let sliced = sliceToBudget(normalized, tokenBudget);
    if (!sliced) {
      const maxChars = Math.max(1, Math.floor(tokenBudget * cpt));
      sliced = normalized.slice(0, Math.max(0, maxChars - 1));
    }
    // Try to include an ellipsis if it still fits the budget
    const withEllipsis = `${sliced}…`;
    if (estimator(withEllipsis) <= tokenBudget) {
      return { text: withEllipsis, truncated: true };
    }
    return { text: sliced, truncated: true };
  }

  // If we didn't keep all sentences, consider it truncated and try to append ellipsis if it fits
  let result = kept.join(" ");
  const truncated = kept.length < sentences.length;
  if (truncated) {
    if (estimator(`${result}…`) <= tokenBudget) {
      result = `${result}…`;
    }
    return { text: result, truncated: true };
  }

  const fits = estimator(result) <= tokenBudget;
  return { text: fits ? result : `${result}…`, truncated: !fits };
}

/**
 * Summarizes prior turns by keeping most recent chunks and compacting their text
 * to fit within the token budget. This is intentionally simplistic and deterministic.
 */
export function summarizeTurns(
  turns: ContextChunk[],
  tokenBudget: number,
  options: CompactOptions = {}
): { text: string; truncated: boolean } {
  const estimator = options.tokenEstimator ?? estimateTokens;
  const reversed = [...(turns ?? [])].reverse();

  const lines: string[] = [];
  let truncatedAny = false;

  for (let i = 0; i < reversed.length; i++) {
    const t = reversed[i];
    const prefix = `[${t.role}]`;
    const joined = `${prefix} ${t.content ?? ""}`.trim();
    const used = estimator(lines.join("\n"));
    const remaining = tokenBudget - used;
    if (remaining <= 0) break;

    // Reserve at least half of remaining budget for subsequent (older) turns
    const reserved = Math.floor(remaining / 2);
    const cap = Math.max(1, reserved);
    const compacted = compactText(joined, cap, options);
    if (compacted.text.length > 0) {
      lines.unshift(compacted.text);
      truncatedAny = truncatedAny || compacted.truncated;
    }
  }

  const text = lines.join("\n");
  const over = estimator(text) > tokenBudget;
  return { text, truncated: truncatedAny || over };
}
