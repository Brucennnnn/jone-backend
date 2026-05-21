import { describe, expect, it } from "vitest";
import { parseAndValidate } from "../../src/analysis/intake.js";

const config = { maxScenarioLength: 100 };

describe("parseAndValidate — required fields", () => {
  it("accepts a minimal valid scenario", () => {
    const result = parseAndValidate({ scenario: "Someone claiming to be my bank asked for my OTP" }, config);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.intake.scenario).toBe("Someone claiming to be my bank asked for my OTP");
  });

  it("rejects missing scenario", () => {
    const result = parseAndValidate({}, config);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("scenario");
  });

  it("rejects non-string scenario", () => {
    const result = parseAndValidate({ scenario: 42 }, config);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("scenario");
  });

  it("rejects non-object body", () => {
    const result = parseAndValidate("just a string", config);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("body");
  });
});

describe("parseAndValidate — empty input", () => {
  it("rejects empty scenario string", () => {
    const result = parseAndValidate({ scenario: "" }, config);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("scenario");
  });

  it("rejects whitespace-only scenario", () => {
    const result = parseAndValidate({ scenario: "   \t\n  " }, config);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("scenario");
  });
});

describe("parseAndValidate — oversized input", () => {
  it("rejects scenario that exceeds maxScenarioLength", () => {
    const result = parseAndValidate({ scenario: "a".repeat(101) }, config);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.field).toBe("scenario");
      expect(result.failure.message).toContain("100");
    }
  });

  it("accepts scenario at exactly the limit", () => {
    const result = parseAndValidate({ scenario: "a".repeat(100) }, config);
    expect(result.ok).toBe(true);
  });
});

describe("parseAndValidate — optional context normalization", () => {
  it("normalizes absent context to empty defaults", () => {
    const result = parseAndValidate({ scenario: "test scenario" }, config);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intake.context).toEqual({
        messageExcerpts: [],
        channel: null,
        suspectedActor: null,
        requestedAction: null,
        requestedPaymentAmount: null,
        deadlineOrUrgency: null,
        alreadyTakenActions: [],
        userConcern: null
      });
    }
  });

  it("trims whitespace from optional string fields", () => {
    const result = parseAndValidate(
      {
        scenario: "test scenario",
        context: {
          suspectedActor: "  Bank Officer  ",
          requestedAction: "Transfer 5000 THB",
          deadlineOrUrgency: "  within 1 hour  "
        }
      },
      config
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intake.context.suspectedActor).toBe("Bank Officer");
      expect(result.intake.context.requestedAction).toBe("Transfer 5000 THB");
      expect(result.intake.context.deadlineOrUrgency).toBe("within 1 hour");
    }
  });

  it("maps empty string optional fields to null", () => {
    const result = parseAndValidate(
      { scenario: "test scenario", context: { userConcern: "   ", requestedPaymentAmount: "" } },
      config
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intake.context.userConcern).toBeNull();
      expect(result.intake.context.requestedPaymentAmount).toBeNull();
    }
  });

  it("preserves messageExcerpts array", () => {
    const result = parseAndValidate(
      { scenario: "test scenario", context: { messageExcerpts: ["msg1", "msg2"] } },
      config
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.intake.context.messageExcerpts).toEqual(["msg1", "msg2"]);
  });

  it("preserves alreadyTakenActions array", () => {
    const result = parseAndValidate(
      { scenario: "test scenario", context: { alreadyTakenActions: ["blocked number", "reported to bank"] } },
      config
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.intake.context.alreadyTakenActions).toEqual(["blocked number", "reported to bank"]);
  });

  it("rejects context that is not an object", () => {
    const result = parseAndValidate({ scenario: "test scenario", context: "invalid" }, config);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("context");
  });

  it("rejects messageExcerpts that is not an array of strings", () => {
    const result = parseAndValidate(
      { scenario: "test scenario", context: { messageExcerpts: [1, 2, 3] } },
      config
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("context.messageExcerpts");
  });

  it("rejects alreadyTakenActions that is not an array of strings", () => {
    const result = parseAndValidate(
      { scenario: "test scenario", context: { alreadyTakenActions: [true, false] } },
      config
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("context.alreadyTakenActions");
  });
});

describe("parseAndValidate — channel enum", () => {
  it.each(["sms", "email", "line", "facebook", "phone", "other"] as const)(
    "accepts valid channel '%s'",
    (channel) => {
      const result = parseAndValidate({ scenario: "test scenario", context: { channel } }, config);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.intake.context.channel).toBe(channel);
    }
  );

  it("rejects unknown channel value", () => {
    const result = parseAndValidate(
      { scenario: "test scenario", context: { channel: "telegram" } },
      config
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("context.channel");
  });

  it("rejects non-string channel", () => {
    const result = parseAndValidate(
      { scenario: "test scenario", context: { channel: 123 } },
      config
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe("context.channel");
  });
});

describe("parseAndValidate — sensitive logging boundaries", () => {
  it("validation error message does not echo back the scenario text", () => {
    const sensitiveScenario = "a".repeat(101);
    const result = parseAndValidate({ scenario: sensitiveScenario }, config);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.message).not.toContain(sensitiveScenario);
    }
  });

  it("validation error for wrong type does not echo the field value", () => {
    const sensitiveValue = "my-account-password-123";
    const result = parseAndValidate({ scenario: sensitiveValue, context: { channel: sensitiveValue } }, config);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.message).not.toContain(sensitiveValue);
    }
  });
});
