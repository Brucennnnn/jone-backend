import { createServer, type Server } from "http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";

const config = loadConfig({ MAX_SCENARIO_LENGTH: "100" });

let server: Server;
let base: string;

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      server = createServer(createApp(config));
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (addr && typeof addr !== "string") {
          base = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    })
);

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

async function post(body: unknown) {
  return fetch(`${base}/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /analysis", () => {
  it("returns 202 for a valid scenario", async () => {
    const res = await post({ scenario: "Someone pretending to be my bank asked for my OTP" });
    expect(res.status).toBe(202);
  });

  it("returns 400 for empty scenario", async () => {
    const res = await post({ scenario: "" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ error: "validation_error", field: "scenario" });
  });

  it("returns 400 for missing scenario", async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ error: "validation_error", field: "scenario" });
  });

  it("returns 400 for oversized scenario without echoing scenario text", async () => {
    const oversized = "x".repeat(101);
    const res = await post({ scenario: oversized });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string; message: string };
    expect(body.error).toBe("validation_error");
    expect(body.message).not.toContain(oversized);
  });

  it("returns 400 for invalid channel without echoing field value", async () => {
    const invalidChannel = "secret-channel-value";
    const res = await post({ scenario: "test scenario", context: { channel: invalidChannel } });
    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).not.toContain(invalidChannel);
  });

  it("returns 202 with full valid context", async () => {
    const res = await post({
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
    expect(res.status).toBe(202);
  });
});
