import type { Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createFakeAnalysisService } from "../src/analyze/fakeAnalysisService.js";
import { loadConfig } from "../src/config.js";

const config = loadConfig({});

function startServer(
  dependencies: Parameters<typeof createApp>[1]
): Promise<{ server: Server; url: string }> {
  return new Promise((resolve) => {
    const app = createApp(config, dependencies);
    const server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address() as { port: number };
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

function stopServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

describe("POST /api/v1/scam/analyze", () => {
  let server: Server;
  let url: string;

  beforeEach(async () => {
    ({ server, url } = await startServer({
      analysisService: createFakeAnalysisService(),
    }));
  });

  afterEach(async () => {
    await stopServer(server);
  });

  it("returns the full analysis response for a scam scenario", async () => {
    const res = await fetch(`${url}/api/v1/scam/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario: "มีคนโทรมาบอกว่าเป็นตำรวจและให้โอนเงิน" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      isScam: true,
      riskLevel: "high",
      confidence: expect.any(Number),
      category: "call_center",
      explanation: expect.any(String),
    });
    expect(body.confidence).toBeGreaterThanOrEqual(0);
    expect(body.confidence).toBeLessThanOrEqual(1);
  });

  it("returns safe shape when service returns non-scam", async () => {
    const { server: s, url: u } = await startServer({
      analysisService: createFakeAnalysisService({ response: { isScam: false } }),
    });

    const res = await fetch(`${u}/api/v1/scam/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario: "สวัสดี วันนี้อากาศดีมาก" }),
    });

    await stopServer(s);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      isScam: false,
      riskLevel: "safe",
      category: "not_scam",
    });
  });

  it("accepts an optional language field", async () => {
    const res = await fetch(`${url}/api/v1/scam/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario: "test", language: "th" }),
    });

    expect(res.status).toBe(200);
  });

  it("returns 400 when scenario is missing", async () => {
    const res = await fetch(`${url}/api/v1/scam/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      error: { code: "VALIDATION_ERROR", message: expect.any(String) },
    });
  });

  it("returns 400 when scenario is blank whitespace", async () => {
    const res = await fetch(`${url}/api/v1/scam/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario: "   " }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when scenario exceeds maxScenarioLength", async () => {
    const { server: s, url: u } = await startServer({
      analysisService: createFakeAnalysisService(),
    });
    const shortConfig = loadConfig({ MAX_SCENARIO_LENGTH: "10" });
    const app = createApp(shortConfig, {
      analysisService: createFakeAnalysisService(),
    });
    await stopServer(s);

    const { server: s2, url: u2 } = await new Promise<{
      server: Server;
      url: string;
    }>((resolve) => {
      const srv = app.listen(0, "127.0.0.1", () => {
        const addr = srv.address() as { port: number };
        resolve({ server: srv, url: `http://127.0.0.1:${addr.port}` });
      });
    });

    const res = await fetch(`${u2}/api/v1/scam/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario: "x".repeat(11) }),
    });

    await stopServer(s2);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 when the service throws", async () => {
    const { server: s, url: u } = await startServer({
      analysisService: createFakeAnalysisService({
        error: new Error("service exploded"),
      }),
    });

    const res = await fetch(`${u}/api/v1/scam/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario: "test scenario" }),
    });

    await stopServer(s);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      error: { code: "INTERNAL_SERVER_ERROR", message: expect.any(String) },
    });
  });
});
