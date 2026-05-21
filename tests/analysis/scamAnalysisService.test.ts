import { describe, expect, it, vi } from "vitest";
import { createScamAnalysisService } from "../../src/analysis/scamAnalysisService.js";
import type { AnalysisRequest } from "../../src/analysis/responseTypes.js";

describe("createScamAnalysisService", () => {
  it("flows through prompt generation, model generation, and normalization", async () => {
    const modelClient = {
      generate: vi.fn(async () =>
        JSON.stringify({
          isScam: true,
          riskLevel: "high",
          confidence: 0.7,
          category: "phishing_link",
          explanation: "The model identified a suspicious link request."
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
    expect(result).toEqual({
      isScam: true,
      riskLevel: "high",
      confidence: 0.7,
      category: "phishing_link",
      explanation: "The model identified a suspicious link request."
    });
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
