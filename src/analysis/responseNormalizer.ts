import {
  SCAM_CATEGORIES,
  RISK_LEVELS,
  type AnalysisResponse,
  type RiskLevel,
  type ScamCategory
} from "./responseTypes.js";

const INCOMPLETE_RESPONSE_EXPLANATION =
  "The model response was incomplete, so this analysis was normalized with conservative defaults.";

const UNPARSEABLE_RESPONSE_EXPLANATION =
  "The model response could not be parsed, so this analysis was normalized with conservative defaults.";

export function normalizeModelResponse(modelOutput: string): AnalysisResponse {
  const parsed = parseModelObject(modelOutput);

  if (!parsed) {
    return createFallbackResponse(UNPARSEABLE_RESPONSE_EXPLANATION, 0.3);
  }

  const isScam = readBoolean(parsed.isScam, true);
  const riskLevel = readRiskLevel(parsed.riskLevel);
  const confidence = readConfidence(parsed.confidence);
  const category = readScamCategory(parsed.category);
  const explanation = readExplanation(parsed.explanation);

  return {
    isScam,
    riskLevel,
    confidence,
    category,
    explanation: explanation ?? INCOMPLETE_RESPONSE_EXPLANATION
  };
}

function createFallbackResponse(
  explanation: string,
  confidence: number
): AnalysisResponse {
  return {
    isScam: true,
    riskLevel: "medium",
    confidence,
    category: "other",
    explanation
  };
}

function parseModelObject(modelOutput: string): Record<string, unknown> | null {
  const trimmed = modelOutput.trim();

  for (const candidate of [trimmed, extractFirstJsonObject(trimmed)]) {
    if (!candidate) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (isPlainObject(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractFirstJsonObject(value: string): string | null {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return value.slice(start, end + 1);
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readRiskLevel(value: unknown): RiskLevel {
  if (
    typeof value === "string" &&
    (RISK_LEVELS as readonly string[]).includes(value)
  ) {
    return value as RiskLevel;
  }

  return "medium";
}

function readConfidence(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, value));
}

function readScamCategory(value: unknown): ScamCategory {
  if (
    typeof value === "string" &&
    (SCAM_CATEGORIES as readonly string[]).includes(value)
  ) {
    return value as ScamCategory;
  }

  return "other";
}

function readExplanation(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
