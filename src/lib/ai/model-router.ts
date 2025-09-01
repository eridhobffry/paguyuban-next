import { AI_ROUTING_POLICY, type ModelKey } from "./config";
import { detectLanguage, type Lang } from "./lang";

export type Complexity = "low" | "medium" | "high";

export interface RouteContext {
  query: string;
  language?: Lang | string;
  task?: "chat" | "analytics" | "coding" | "document" | "image" | "audio";
  taskComplexity?: Complexity;
  involves?: Array<"math" | "coding" | "analytics">;
  modalities?: Array<"image" | "pdf" | "audio">;
  localizationRequired?: boolean;
  lastTriedModel?: ModelKey;
  hadModelError?: boolean;
}

export interface RouteDecision {
  model: ModelKey;
  reason: string;
  language: Lang;
  effort: Complexity;
  budget: { targetMs: number; maxMs: number };
}

export function selectModel(ctx: RouteContext): RouteDecision {
  const lang = normalizeLang(ctx.language ?? detectLanguage(ctx.query));
  const involves = new Set(ctx.involves || []);
  const modalities = new Set(ctx.modalities || []);
  const complexity: Complexity = ctx.taskComplexity || inferComplexity(ctx.query, involves);

  // Fallback routing on prior error
  if (ctx.hadModelError && ctx.lastTriedModel) {
    const alt: ModelKey = ctx.lastTriedModel === "qwen25-max" ? "deepseek-v3" : "qwen25-max";
    return decision(alt, lang, `fallback_from_${ctx.lastTriedModel}`, complexity);
  }

  // Rule: High complexity or analytics/coding → DeepSeek
  if (
    complexity === "high" ||
    involves.has("analytics") ||
    involves.has("math") ||
    involves.has("coding") ||
    ctx.task === "analytics" ||
    ctx.task === "coding"
  ) {
    return decision("deepseek-v3", lang, "high_complexity_or_analytics", complexity);
  }

  // Rule: ID/MS language or localization → Qwen
  if (lang === "id" || lang === "ms" || ctx.localizationRequired) {
    // For heavy analytics inside doc/image/audio, escalate
    if (
      (modalities.size > 0 || ctx.task === "document" || ctx.task === "image" || ctx.task === "audio") &&
      (involves.has("analytics") || complexity === "high")
    ) {
      return decision("deepseek-v3", lang, "multimodal_with_heavy_analytics", "high");
    }
    return decision("qwen25-max", lang, "multilingual_or_localization", complexity);
  }

  // Rule: Multimodal in ID/MS prefers Qwen; otherwise default
  if (modalities.size > 0 && (lang === "id" || lang === "ms")) {
    return decision("qwen25-max", lang, "multimodal_id_ms", complexity);
  }

  // Default model
  return decision(AI_ROUTING_POLICY.defaultModel, lang, "default", complexity);
}

function decision(model: ModelKey, language: Lang, reason: string, effort: Complexity): RouteDecision {
  return {
    model,
    reason,
    language,
    effort,
    budget: {
      targetMs: AI_ROUTING_POLICY.qualityBudget.targetMs,
      maxMs: AI_ROUTING_POLICY.qualityBudget.hardCeilingMs,
    },
  };
}

function normalizeLang(l: string): Lang {
  const s = (l || "").toLowerCase();
  if (s.startsWith("id")) return "id";
  if (s.startsWith("ms") || s.startsWith("ms-my") || s.startsWith("my")) return "ms";
  if (s.startsWith("de")) return "de";
  if (s.startsWith("en")) return "en";
  return detectLanguage(s);
}

function inferComplexity(query: string, involves: Set<string>): Complexity {
  const t = (query || "").toLowerCase();
  const highSignals = [
    "optimize",
    "optimasi",
    "optimum",
    "schedule",
    "jadwal",
    "jadual",
    "kontrak",
    "contract",
    "analisis",
    "analytics",
    "metric",
    "perkiraan",
    "forecast",
    "roi",
    "regression",
    "cluster",
  ];
  if (highSignals.some((w) => t.includes(w)) || involves.has("analytics")) return "high";
  if (t.length > 300) return "medium";
  return "low";
}

