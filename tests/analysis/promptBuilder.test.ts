import { describe, expect, it } from "vitest";
import { buildAnalysisPrompt } from "../../src/analysis/promptBuilder.js";
import type { NormalizedIntake } from "../../src/analysis/requestTypes.js";

function makeIntake(scenario = "Test scenario", ctx: Partial<NormalizedIntake["context"]> = {}): NormalizedIntake {
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
      userConcern: null,
      ...ctx
    }
  };
}

describe("buildAnalysisPrompt — scenario facts", () => {
  it("includes the scenario text", () => {
    const prompt = buildAnalysisPrompt(makeIntake("Someone asked for my OTP"));
    expect(prompt).toContain("Someone asked for my OTP");
  });

  it("includes channel when provided", () => {
    const prompt = buildAnalysisPrompt(makeIntake("scenario", { channel: "line" }));
    expect(prompt).toContain("line");
  });

  it("includes suspected actor when provided", () => {
    const prompt = buildAnalysisPrompt(makeIntake("scenario", { suspectedActor: "Fake bank officer" }));
    expect(prompt).toContain("Fake bank officer");
  });

  it("includes requested payment amount when provided", () => {
    const prompt = buildAnalysisPrompt(makeIntake("scenario", { requestedPaymentAmount: "5000 THB" }));
    expect(prompt).toContain("5000 THB");
  });

  it("includes deadline or urgency when provided", () => {
    const prompt = buildAnalysisPrompt(makeIntake("scenario", { deadlineOrUrgency: "within 1 hour" }));
    expect(prompt).toContain("within 1 hour");
  });

  it("includes message excerpts when provided", () => {
    const prompt = buildAnalysisPrompt(makeIntake("scenario", { messageExcerpts: ["Send OTP now", "Account blocked"] }));
    expect(prompt).toContain("Send OTP now");
    expect(prompt).toContain("Account blocked");
  });

  it("includes already taken actions when provided", () => {
    const prompt = buildAnalysisPrompt(makeIntake("scenario", { alreadyTakenActions: ["blocked the number"] }));
    expect(prompt).toContain("blocked the number");
  });

  it("includes user concern when provided", () => {
    const prompt = buildAnalysisPrompt(makeIntake("scenario", { userConcern: "I almost transferred money" }));
    expect(prompt).toContain("I almost transferred money");
  });

  it("omits CONTEXT section when all context fields are empty", () => {
    const prompt = buildAnalysisPrompt(makeIntake());
    expect(prompt).not.toContain("CONTEXT:");
  });

  it("includes CONTEXT section when at least one field is present", () => {
    const prompt = buildAnalysisPrompt(makeIntake("scenario", { channel: "sms" }));
    expect(prompt).toContain("CONTEXT:");
  });
});

describe("buildAnalysisPrompt — JSON schema", () => {
  it("names all required response fields", () => {
    const prompt = buildAnalysisPrompt(makeIntake());
    expect(prompt).toContain("isScam");
    expect(prompt).toContain("riskLevel");
    expect(prompt).toContain("confidence");
    expect(prompt).toContain("category");
    expect(prompt).toContain("explanation");
  });

  it("lists all risk level values", () => {
    const prompt = buildAnalysisPrompt(makeIntake());
    for (const level of ["safe", "low", "medium", "high", "critical"]) {
      expect(prompt).toContain(level);
    }
  });

  it("instructs the model to respond with JSON only", () => {
    const prompt = buildAnalysisPrompt(makeIntake());
    expect(prompt.toLowerCase()).toContain("json only");
  });
});

describe("buildAnalysisPrompt — safety instructions", () => {
  it("includes pause instruction", () => {
    expect(buildAnalysisPrompt(makeIntake()).toLowerCase()).toContain("pause");
  });

  it("includes verify through official channels", () => {
    expect(buildAnalysisPrompt(makeIntake()).toLowerCase()).toContain("official channels");
  });

  it("includes do not pay instruction", () => {
    expect(buildAnalysisPrompt(makeIntake()).toLowerCase()).toContain("do not pay");
  });

  it("includes do not share credentials instruction", () => {
    const prompt = buildAnalysisPrompt(makeIntake()).toLowerCase();
    expect(prompt).toContain("do not share");
    expect(prompt).toMatch(/otp|password/);
  });

  it("includes secure accounts instruction", () => {
    expect(buildAnalysisPrompt(makeIntake()).toLowerCase()).toContain("secure accounts");
  });

  it("includes preserve evidence instruction", () => {
    expect(buildAnalysisPrompt(makeIntake()).toLowerCase()).toContain("preserve evidence");
  });

  it("includes report instruction with hotline reference", () => {
    const prompt = buildAnalysisPrompt(makeIntake()).toLowerCase();
    expect(prompt).toContain("report");
    expect(prompt).toMatch(/1599|191|police/);
  });
});

describe("buildAnalysisPrompt — uncertainty guidance", () => {
  it("instructs model to hedge when evidence is incomplete", () => {
    const prompt = buildAnalysisPrompt(makeIntake()).toLowerCase();
    expect(prompt).toContain("incomplete");
    expect(prompt).toMatch(/likely|possibly/);
  });

  it("specifies a confidence threshold for uncertainty", () => {
    const prompt = buildAnalysisPrompt(makeIntake());
    expect(prompt).toContain("0.7");
  });
});
