import { describe, expect, it } from "vitest";
import { applySafetyGuardrails } from "../../src/analysis/guardrails.js";
import type { AnalysisResponse } from "../../src/analysis/responseTypes.js";

const unsafeBaseResponse: AnalysisResponse = {
  isScam: false,
  riskLevel: "low",
  confidence: 0.4,
  category: "not_scam",
  explanation: "This seems normal. You can continue."
};

describe("applySafetyGuardrails", () => {
  it("blocks advice that encourages sharing OTPs or passwords", () => {
    const result = applySafetyGuardrails(
      {
        ...unsafeBaseResponse,
        explanation: "Share your OTP and password with the caller."
      },
      "A bank employee asked for my OTP and password to verify my account"
    );

    expect(result).toMatchObject({
      isScam: true,
      riskLevel: "critical",
      category: "phishing_link"
    });
    expect(result.explanation).toContain("Do not share OTPs");
    expect(result.explanation).toContain("secure your account");
  });

  it("adds money transfer protections", () => {
    const result = applySafetyGuardrails(
      unsafeBaseResponse,
      "They said I must transfer 5000 THB to avoid police charges"
    );

    expect(result.riskLevel).toBe("critical");
    expect(result.explanation).toContain("pause before sending money");
    expect(result.explanation).toContain("verify through official channels");
    expect(result.explanation).toContain("preserve evidence");
    expect(result.explanation).toContain("contact your bank");
  });

  it("adds recovery steps when money was already sent", () => {
    const result = applySafetyGuardrails(
      unsafeBaseResponse,
      "I already transferred money to the account they gave me"
    );

    expect(result.riskLevel).toBe("critical");
    expect(result.explanation).toContain("contact your bank immediately");
    expect(result.explanation).toContain("save transaction records");
  });

  it("adds account recovery steps when credentials were already shared", () => {
    const result = applySafetyGuardrails(
      unsafeBaseResponse,
      "I already shared my password and recovery code with someone on LINE"
    );

    expect(result.riskLevel).toBe("critical");
    expect(result.explanation).toContain("change passwords immediately");
    expect(result.explanation).toContain("revoke sessions");
  });

  it("adds device safety steps for suspicious app installation", () => {
    const result = applySafetyGuardrails(
      unsafeBaseResponse,
      "They told me to install a remote access app and I already installed it"
    );

    expect(result.riskLevel).toBe("critical");
    expect(result.explanation).toContain("disconnect the device");
    expect(result.explanation).toContain("uninstall suspicious apps");
  });

  it("adds identity document protections", () => {
    const result = applySafetyGuardrails(
      unsafeBaseResponse,
      "A recruiter asked me to send my passport and national ID"
    );

    expect(result.riskLevel).toBe("high");
    expect(result.explanation).toContain("Do not send identity documents");
    expect(result.explanation).toContain("verified official channel");
  });

  it("adds blackmail and sextortion guidance", () => {
    const result = applySafetyGuardrails(
      unsafeBaseResponse,
      "Someone is blackmailing me with private photos and demands payment"
    );

    expect(result.riskLevel).toBe("critical");
    expect(result.explanation).toContain("do not pay");
    expect(result.explanation).toContain("preserve evidence");
    expect(result.explanation).toContain("stop direct communication");
  });
});
