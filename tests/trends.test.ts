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

function response(category: "call_center" | "phishing_link") {
  return {
    isScam: true,
    riskLevel: "high" as const,
    confidence: 0.8,
    category,
    explanation: "Suspicious behavior"
  };
}
