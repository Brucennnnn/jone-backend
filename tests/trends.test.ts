import { describe, expect, it } from "vitest";
import { handleTrendRequest } from "../src/trends/http.js";
import { createInMemoryTrendStore } from "../src/trends/inMemoryTrendStore.js";

describe("trend endpoint", () => {
  it("returns accumulated scam type and common phrase trends", async () => {
    const service = createInMemoryTrendStore();
    service.recordAnalysis(
      intake("Someone asked me to send OTP by SMS"),
      response("phishing_link")
    );
    service.recordAnalysis(
      intake("Someone asked me to send OTP again"),
      response("phishing_link")
    );
    service.recordAnalysis(
      intake("A caller said I must transfer money"),
      response("call_center")
    );

    const result = await handleTrendRequest(service);

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      scamTypes: expect.arrayContaining([
        { category: "phishing_link", count: 2 },
        { category: "call_center", count: 1 }
      ]),
      commonPhrases: expect.arrayContaining([
        { phrase: "send otp", count: 2 }
      ])
    });
  });

  it("returns a fresh trend object for each service call", async () => {
    const service = createInMemoryTrendStore();
    service.recordAnalysis(intake("A caller asked for OTP"), response("call_center"));

    const first = await service.getTrends();
    first.scamTypes[0].count = 0;

    const second = await service.getTrends();

    expect(second.scamTypes[0]).toEqual({
      category: "call_center",
      count: 1
    });
  });

  it("keeps Thai phrase with trailing number together and does not emit bare numbers", async () => {
    const service = createInMemoryTrendStore();
    service.recordAnalysis(
      intake("เพื่อนชวนไปลงทุน บอกว่าจะได้ผลตอบแทน 200%"),
      response("investment_fraud")
    );

    const result = await service.getTrends();
    const phrases = result.commonPhrases.map((p) => p.phrase);

    expect(phrases).toContain("เพื่อนชวนไปลงทุน บอกว่าจะได้ผลตอบแทน 200%");
    expect(phrases).not.toContain("200");
    expect(phrases).not.toContain("200%");
  });

  it("does not count non-scam analysis responses", async () => {
    const service = createInMemoryTrendStore();

    service.recordAnalysis(
      intake("A normal appointment reminder"),
      {
        isScam: false,
        riskLevel: "safe",
        confidence: 0.9,
        category: "not_scam",
        explanation: "No scam indicators"
      }
    );

    await expect(service.getTrends()).resolves.toEqual({
      scamTypes: [],
      commonPhrases: []
    });
  });
});

function intake(scenario: string) {
  return {
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
  };
}

function response(category: "call_center" | "phishing_link" | "investment_fraud") {
  return {
    isScam: true,
    riskLevel: "high" as const,
    confidence: 0.8,
    category,
    explanation: "Suspicious behavior"
  };
}
