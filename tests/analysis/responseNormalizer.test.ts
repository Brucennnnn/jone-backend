import { describe, expect, it } from "vitest";
import { normalizeModelResponse } from "../../src/analysis/responseNormalizer.js";

describe("normalizeModelResponse", () => {
  it("parses valid JSON model output into the public analysis contract", () => {
    const result = normalizeModelResponse(
      JSON.stringify({
        isScam: true,
        riskLevel: "critical",
        confidence: 0.97,
        category: "phishing_link",
        explanation: "The message asks for credentials through a suspicious link."
      })
    );

    expect(result).toEqual({
      isScam: true,
      riskLevel: "critical",
      confidence: 0.97,
      category: "phishing_link",
      explanation: "The message asks for credentials through a suspicious link."
    });
  });

  it("applies safe defaults for missing optional model fields", () => {
    const result = normalizeModelResponse(JSON.stringify({ isScam: true }));

    expect(result).toEqual({
      isScam: true,
      riskLevel: "medium",
      confidence: 0.5,
      category: "other",
      explanation:
        "The model response was incomplete, so this analysis was normalized with conservative defaults."
    });
  });

  it("coerces invalid enum values and out-of-range confidence", () => {
    const result = normalizeModelResponse(
      JSON.stringify({
        isScam: true,
        riskLevel: "dangerous",
        confidence: 3,
        category: "wire_transfer_scam",
        explanation: "Unknown enum values should not leak to clients."
      })
    );

    expect(result).toMatchObject({
      isScam: true,
      riskLevel: "medium",
      confidence: 1,
      category: "other"
    });
  });

  it("extracts JSON from overly verbose model output", () => {
    const result = normalizeModelResponse(`
      Here is the result:
      {
        "isScam": false,
        "riskLevel": "low",
        "confidence": 0.8,
        "category": "not_scam",
        "explanation": "No strong scam indicators were provided."
      }
      Please review carefully.
    `);

    expect(result).toMatchObject({
      isScam: false,
      riskLevel: "low",
      confidence: 0.8,
      category: "not_scam"
    });
  });

  it("falls back safely for invalid JSON without returning raw model text", () => {
    const raw = "This is not JSON and includes a fake password: hunter2";

    const result = normalizeModelResponse(raw);

    expect(result).toEqual({
      isScam: true,
      riskLevel: "medium",
      confidence: 0.3,
      category: "other",
      explanation:
        "The model response could not be parsed, so this analysis was normalized with conservative defaults."
    });
    expect(result.explanation).not.toContain("hunter2");
  });

  it("falls back safely for a JSON value that is not an object", () => {
    const result = normalizeModelResponse("[1, 2, 3]");

    expect(result).toMatchObject({
      isScam: true,
      riskLevel: "medium",
      confidence: 0.3,
      category: "other"
    });
  });
});
