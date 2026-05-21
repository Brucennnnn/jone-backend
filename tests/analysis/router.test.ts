import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config.js";
import { handleAnalysisRequest } from "../../src/analysis/router.js";

const config = loadConfig({ MAX_SCENARIO_LENGTH: "100" });

describe("POST /analysis", () => {
  it("returns 202 for a valid scenario", () => {
    const result = post({
      scenario: "Someone pretending to be my bank asked for my OTP"
    });

    expect(result.statusCode).toBe(202);
  });

  it("returns 400 for empty scenario", () => {
    const result = post({ scenario: "" });

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "validation_error",
      field: "scenario"
    });
  });

  it("returns 400 for missing scenario", () => {
    const result = post({});

    expect(result.statusCode).toBe(400);
    expect(result.body).toMatchObject({
      error: "validation_error",
      field: "scenario"
    });
  });

  it("returns 400 for oversized scenario without echoing scenario text", () => {
    const oversized = "x".repeat(101);
    const result = post({ scenario: oversized });
    const body = result.body as { error: string; message: string };

    expect(result.statusCode).toBe(400);
    expect(body.error).toBe("validation_error");
    expect(body.message).not.toContain(oversized);
  });

  it("returns 400 for invalid channel without echoing field value", () => {
    const invalidChannel = "secret-channel-value";
    const result = post({
      scenario: "test scenario",
      context: { channel: invalidChannel }
    });
    const body = result.body as { message: string };

    expect(result.statusCode).toBe(400);
    expect(body.message).not.toContain(invalidChannel);
  });

  it("returns 202 with full valid context", () => {
    const result = post({
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

    expect(result.statusCode).toBe(202);
  });
});

function post(body: unknown) {
  return handleAnalysisRequest(body, config);
}
