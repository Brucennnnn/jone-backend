import { describe, expect, it } from "vitest";
import { handleAnalyzeRequest } from "../../src/analysis/analyzeHandler.js";
import { createFakeAnalysisService } from "../../src/analysis/fakeAnalysisService.js";
import { loadConfig } from "../../src/config.js";

const config = loadConfig({ MAX_SCENARIO_LENGTH: "100" });
const service = createFakeAnalysisService();

describe("analysis routes", () => {
  it("returns analysis response for a valid scenario", async () => {
    const result = await post({
      scenario: "Someone pretending to be my bank asked for my OTP"
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      isScam: true,
      riskLevel: "high",
      confidence: expect.any(Number),
      category: "call_center",
      explanation: expect.any(String)
    });
  });

  it("returns 400 for empty scenario", async () => {
    const result = await post({ scenario: "" });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: expect.any(String)
      }
    });
  });

  it("returns 400 for missing scenario", async () => {
    const result = await post({});

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: expect.any(String)
      }
    });
  });

  it("returns 400 for oversized scenario without echoing scenario text", async () => {
    const oversized = "x".repeat(101);
    const result = await post({ scenario: oversized });
    const body = result.body as { error: { message: string } };

    expect(result.statusCode).toBe(400);
    expect(body.error.message).not.toContain(oversized);
  });

  it("returns 400 for invalid channel without echoing field value", async () => {
    const invalidChannel = "secret-channel-value";
    const result = await post({
      scenario: "test scenario",
      context: { channel: invalidChannel }
    });
    const body = result.body as { error: { message: string } };

    expect(result.statusCode).toBe(400);
    expect(body.error.message).not.toContain(invalidChannel);
  });

  it("returns analysis response with full valid context", async () => {
    const result = await post({
      scenario: "A stranger offered me a job and asked for my bank details",
      context: {
        channel: "line",
        suspectedActor: "Fake recruiter",
        messageExcerpts: ["You won a prize!", "Send your bank account number"],
        requestedPaymentAmount: "500 THB",
        deadlineOrUrgency: "within 2 hours",
        alreadyTakenActions: ["ignored first message"],
        userConcern: "I almost transferred money"
      }
    });

    expect(result.statusCode).toBe(200);
  });
});

function post(body: unknown) {
  return handleAnalyzeRequest(body, config, service);
}
