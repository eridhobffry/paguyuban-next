// Phase 7 — AI routing configuration
// Centralized config for model selection, quality budgets, and fallback policy

export type ModelKey = "qwen25-max" | "deepseek-v3";

export interface ModelInfo {
  role: string;
  notes: string;
}

export interface QualityBudget {
  targetMs: number;
  hardCeilingMs: number;
  costMode: "balanced" | "low" | "high";
}

export interface RoutingPolicy {
  defaultModel: ModelKey;
  models: Record<ModelKey, ModelInfo>;
  qualityBudget: QualityBudget;
  fallback: {
    onError: "route_to_other" | "fail";
    logReason: boolean;
  };
}

export const AI_ROUTING_POLICY: RoutingPolicy = {
  defaultModel: "qwen25-max",
  models: {
    "deepseek-v3": {
      role: "analytics+reasoning",
      notes:
        "advanced code/math & analysis; MoE strong on reasoning. Use for complex analytics, scheduling optimization, contracts summarization with cross-check.",
    },
    "qwen25-max": {
      role: "multilingual",
      notes:
        "best Indonesian/Malay fluency & cultural context; multimodal capable. Use for live chat, translation, ID/MS writing, doc/image questions.",
    },
  },
  qualityBudget: {
    targetMs: 1200,
    hardCeilingMs: 4000,
    costMode: "balanced",
  },
  fallback: {
    onError: "route_to_other",
    logReason: true,
  },
};

export function getDefaultModel(): ModelKey {
  return AI_ROUTING_POLICY.defaultModel;
}

