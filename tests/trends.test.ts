import { describe, expect, it } from "vitest";
import { handleTrendRequest } from "../src/trends/http.js";
import { createInMemoryTrendStore } from "../src/trends/inMemoryTrendStore.js";

describe("trend endpoint", () => {
  it("returns mock default trends before live analyses are recorded", async () => {
    const service = createInMemoryTrendStore();

    await expect(service.getTrends()).resolves.toMatchObject({
      scamTypes: [
        { category: "call_center", count: 45 },
        { category: "romance_scam", count: 32 },
        { category: "phishing_link", count: 28 },
        { category: "investment_fraud", count: 24 },
        { category: "parcel_delivery", count: 18 }
      ],
      commonPhrases: [
        { phrase: "โอนด่วน", count: 78 },
        { phrase: "ตรวจสอบบัญชี", count: 56 },
        { phrase: "ส่ง OTP", count: 42 },
        { phrase: "บัญชีถูกล็อก", count: 35 },
        { phrase: "guaranteed profit", count: 23 }
      ]
    });
  });

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
        { category: "call_center", count: 46 },
        { category: "phishing_link", count: 30 }
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
      count: 46
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

    await expect(service.getTrends()).resolves.toMatchObject({
      scamTypes: [
        { category: "call_center", count: 45 },
        { category: "romance_scam", count: 32 },
        { category: "phishing_link", count: 28 },
        { category: "investment_fraud", count: 24 },
        { category: "parcel_delivery", count: 18 }
      ],
      commonPhrases: [
        { phrase: "โอนด่วน", count: 78 },
        { phrase: "ตรวจสอบบัญชี", count: 56 },
        { phrase: "ส่ง OTP", count: 42 },
        { phrase: "บัญชีถูกล็อก", count: 35 },
        { phrase: "guaranteed profit", count: 23 }
      ]
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
