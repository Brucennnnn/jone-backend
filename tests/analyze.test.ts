import type { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import { createAnalyzeHandler } from "../src/analysis/handler.js";
import { loadConfig } from "../src/config.js";
import { OllamaError } from "../src/ollama.js";
import { createFakeAnalysisService } from "./fakes/fakeAnalysisService.js";

const config = loadConfig({});

describe("POST /api/v1/scam/analyze", () => {
  it("returns the full analysis response for a scam scenario", async () => {
    const result = await callAnalyzeHandler({
      scenario: "มีคนโทรมาบอกว่าเป็นตำรวจและให้โอนเงิน"
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      isScam: true,
      riskLevel: "high",
      confidence: expect.any(Number),
      category: "call_center",
      explanation: expect.any(String)
    });
    expect(result.body.confidence).toBeGreaterThanOrEqual(0);
    expect(result.body.confidence).toBeLessThanOrEqual(1);
  });

  it("returns safe shape when service returns non-scam", async () => {
    const result = await callAnalyzeHandler(
      { scenario: "สวัสดี วันนี้อากาศดีมาก" },
      createFakeAnalysisService({ response: { isScam: false } })
    );

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      isScam: false,
      riskLevel: "safe",
      category: "not_scam"
    });
  });

  it("accepts an optional language field", async () => {
    const result = await callAnalyzeHandler({ scenario: "test", language: "th" });

    expect(result.statusCode).toBe(200);
  });

  it("returns 400 when scenario is missing", async () => {
    const result = await callAnalyzeHandler({});

    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual({
      error: { code: "VALIDATION_ERROR", message: expect.any(String) }
    });
  });

  it("returns 400 when scenario is blank whitespace", async () => {
    const result = await callAnalyzeHandler({ scenario: "   " });

    expect(result.statusCode).toBe(400);
    expect(result.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when scenario exceeds maxScenarioLength", async () => {
    const shortConfig = loadConfig({ MAX_SCENARIO_LENGTH: "10" });
    const result = await callAnalyzeHandler(
      { scenario: "x".repeat(11) },
      createFakeAnalysisService(),
      shortConfig
    );

    expect(result.statusCode).toBe(400);
    expect(result.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 when the service throws", async () => {
    const result = await callAnalyzeHandler(
      { scenario: "test scenario" },
      createFakeAnalysisService({ error: new Error("service exploded") })
    );

    expect(result.statusCode).toBe(500);
    expect(result.body).toEqual({
      error: { code: "INTERNAL_SERVER_ERROR", message: expect.any(String) }
    });
  });

  it("returns 503 when the model runtime is unavailable", async () => {
    const result = await callAnalyzeHandler(
      { scenario: "test scenario" },
      createFakeAnalysisService({
        error: new OllamaError("unavailable", "Ollama runtime is unavailable")
      })
    );

    expect(result.statusCode).toBe(503);
    expect(result.body).toEqual({
      error: {
        code: "MODEL_UNAVAILABLE",
        message: "Ollama runtime is unavailable"
      }
    });
  });

  it("returns 504 when the model request times out", async () => {
    const result = await callAnalyzeHandler(
      { scenario: "test scenario" },
      createFakeAnalysisService({
        error: new OllamaError("timeout", "Ollama request timed out")
      })
    );

    expect(result.statusCode).toBe(504);
    expect(result.body.error.code).toBe("MODEL_TIMEOUT");
  });

  it("returns 502 when the model response is malformed", async () => {
    const result = await callAnalyzeHandler(
      { scenario: "test scenario" },
      createFakeAnalysisService({
        error: new OllamaError(
          "malformed_response",
          "Ollama generation response did not include model text"
        )
      })
    );

    expect(result.statusCode).toBe(502);
    expect(result.body.error.code).toBe("MODEL_RESPONSE_ERROR");
  });
});

async function callAnalyzeHandler(
  body: Record<string, unknown>,
  service = createFakeAnalysisService(),
  handlerConfig = config
): Promise<{ statusCode: number; body: any }> {
  let statusCode = 200;
  let responseBody: any;

  const request = { body } as Request;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(bodyValue: unknown) {
      responseBody = bodyValue;
      return this;
    }
  } as Response;

  await createAnalyzeHandler(handlerConfig, service)(request, response);

  return { statusCode, body: responseBody };
}
