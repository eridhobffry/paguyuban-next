export type ContextRole =
  | "system"
  | "policy"
  | "user"
  | "assistant"
  | "tool"
  | "overlay";

export interface ContextChunk {
  id?: string;
  role: ContextRole;
  content: string;
  timestamp?: number; // ms epoch
  essential?: boolean; // never drop
  priority?: number; // higher = more important (optional override)
}

export interface AssembleInput {
  system?: ContextChunk[];
  policy?: ContextChunk[];
  current?: ContextChunk[]; // current turn messages (usually user + any immediate context)
  overlays?: ContextChunk[];
  tools?: ContextChunk[];
  history?: ContextChunk[]; // prior conversation
}

export interface AssembleOptions {
  maxTokens: number; // model limit
  headroomRatio?: number; // 0.0–0.5 (default 0.1)
  tokenEstimator?: (text: string) => number; // optional custom estimator
}

// Simple heuristic: approx 4 characters per token (safe-side)
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Normalize whitespace to avoid over-counting
  const normalized = text.replace(/\s+/g, " ").trim();
  return Math.max(1, Math.ceil(normalized.length / 4));
}

export function modelBudget(maxTokens: number, headroomRatio = 0.1): number {
  const headroom = Math.max(0, Math.min(0.5, headroomRatio));
  return Math.max(1, Math.floor(maxTokens * (1 - headroom)));
}

function chunkTokens(
  chunk: ContextChunk,
  estimator: (text: string) => number
): number {
  return estimator(chunk.content);
}

function defaultPriority(role: ContextRole): number {
  switch (role) {
    case "system":
      return 100;
    case "policy":
      return 90;
    case "user":
      return 80;
    case "assistant":
      return 70;
    case "overlay":
      return 60;
    case "tool":
      return 50;
    default:
      return 10;
  }
}

function sortChunksForInclusion(chunks: ContextChunk[]): ContextChunk[] {
  return [...chunks].sort((a, b) => {
    const pa = a.priority ?? defaultPriority(a.role);
    const pb = b.priority ?? defaultPriority(b.role);
    if (pa !== pb) return pb - pa; // higher priority first
    const ta = a.timestamp ?? 0;
    const tb = b.timestamp ?? 0;
    return tb - ta; // newer first
  });
}

export function assembleContext(
  input: AssembleInput,
  opts: AssembleOptions
): ContextChunk[] {
  const estimator = opts.tokenEstimator ?? estimateTokens;
  const budget = modelBudget(opts.maxTokens, opts.headroomRatio ?? 0.1);

  const all: ContextChunk[] = [
    ...(input.system ?? []),
    ...(input.policy ?? []),
    ...(input.current ?? []),
    ...(input.overlays ?? []),
    ...(input.tools ?? []),
    ...(input.history ?? []),
  ];

  const ordered = sortChunksForInclusion(all);

  const included: ContextChunk[] = [];
  let used = 0;

  // Always try to include essential chunks first (in their relative order)
  const essentials = ordered.filter((c) => c.essential);
  for (const c of essentials) {
    const t = chunkTokens(c, estimator);
    included.push(c);
    used += t;
  }

  // Include remaining chunks by priority until budget is reached
  for (const c of ordered) {
    if (c.essential) continue; // already handled
    const t = chunkTokens(c, estimator);
    if (used + t <= budget) {
      included.push(c);
      used += t;
    }
  }

  // If even essentials exceed budget, keep as many as possible (drop lowest-priority essentials first)
  // This is a last resort to ensure we always return something within budget.
  if (used > budget) {
    const essentialsSorted = sortChunksForInclusion(
      included.filter((c) => c.essential)
    );
    const nonEssentials = included.filter((c) => !c.essential);

    // Remove lowest priority essentials until within budget
    while (used > budget && essentialsSorted.length > 0) {
      const removed = essentialsSorted.pop()!;
      const idx = included.indexOf(removed);
      if (idx >= 0) included.splice(idx, 1);
      used -= chunkTokens(removed, estimator);
    }

    // If still over budget, remove non-essentials from lowest priority
    const nonEssentialsSorted = sortChunksForInclusion(nonEssentials).reverse();
    for (const c of nonEssentialsSorted) {
      if (used <= budget) break;
      const idx = included.indexOf(c);
      if (idx >= 0) included.splice(idx, 1);
      used -= chunkTokens(c, estimator);
    }
  }

  return included;
}
