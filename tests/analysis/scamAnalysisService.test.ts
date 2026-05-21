import { describe, expect, it, vi } from "vitest";
import { createScamAnalysisService } from "../../src/analysis/scamAnalysisService.js";
import type { AnalysisRequest } from "../../src/analysis/responseTypes.js";

describe("createScamAnalysisService", () => {
  it("flows through prompt generation, model generation, normalization, and guardrails", async () => {
    const modelClient = {
      generate: vi.fn(async () =>
        JSON.stringify({
          isScam: false,
          riskLevel: "low",
          confidence: 0.4,
          category: "not_scam",
          explanation: "The model thought it was safe."
        })
      )
    };
    const service = createScamAnalysisService(modelClient);

    const result = await service.analyze(
      analysisRequest("A caller asked me to transfer money immediately")
    );

    expect(modelClient.generate).toHaveBeenCalledWith({
      prompt: expect.stringContaining("A caller asked me to transfer money immediately")
    });
    expect(result).toMatchObject({
      isScam: true,
      riskLevel: "critical",
      category: "mule_account"
    });
    expect(result.explanation).toContain("pause before sending money");
  });

  it("returns normalized fallback output for invalid model JSON", async () => {
    const service = createScamAnalysisService({
      generate: async () => "not json"
    });

    const result = await service.analyze(analysisRequest("Suspicious message"));

    expect(result).toEqual({
      isScam: true,
      riskLevel: "medium",
      confidence: 0.3,
      category: "other",
      explanation:
        "The model response could not be parsed, so this analysis was normalized with conservative defaults."
    });
  });
});

function analysisRequest(scenario: string): AnalysisRequest {
  return {
    intake: {
      scenario,
      context: {
        messageExcerpts: [],
        channel: null,
        suspectedActor: null,
        requestedAction: null,
        requestedPaymentAmount: null,
        deadlineOrUrgency: null,
        alreadyTakenActions: [],
        userConcern: null
      }
    }
  };
}
