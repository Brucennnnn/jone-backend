import { describe, expect, it, vi } from "vitest";
import { OllamaClient, OllamaError } from "../src/ollama.js";

const baseOptions = {
  baseUrl: "http://ollama.test",
  model: "scb10x/typhoon2.5-qwen3-4b",
  timeoutMs: 1000
};

describe("OllamaClient", () => {
  it("sends configured model and returns generated text", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({ response: "pause and verify" });
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expect(client.generate({ prompt: "Suspicious SMS" })).resolves.toBe(
      "pause and verify"
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://ollama.test/api/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          model: "scb10x/typhoon2.5-qwen3-4b",
          prompt: "Suspicious SMS",
          stream: false
        })
      })
    );
  });

  it("returns thinking text when reasoning models leave response blank", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({
        response: "",
        thinking:
          '```json\n{"isScam":true,"riskLevel":"high","confidence":0.9,"category":"phishing_link","explanation":"test"}\n```'
      });
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expect(client.generate({ prompt: "Suspicious SMS" })).resolves.toBe(
      '```json\n{"isScam":true,"riskLevel":"high","confidence":0.9,"category":"phishing_link","explanation":"test"}\n```'
    );
  });

  it("treats blank response and thinking as malformed output", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({ response: "  ", thinking: "\n" });
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expectOllamaError(
      client.generate({ prompt: "test" }),
      "malformed_response"
    );
  });

  it("maps unavailable runtime errors", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expectOllamaError(
      client.generate({ prompt: "test" }),
      "unavailable"
    );
  });

  it("maps missing model responses", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({ error: "model not found" }, 404);
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expectOllamaError(
      client.generate({ prompt: "test" }),
      "missing_model"
    );
  });

  it("maps timeout errors", async () => {
    const fetchMock = vi.fn(async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expectOllamaError(client.generate({ prompt: "test" }), "timeout");
  });

  it("maps malformed generation responses", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({ done: true });
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expectOllamaError(
      client.generate({ prompt: "test" }),
      "malformed_response"
    );
  });

  it("maps unexpected HTTP failures", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({ error: "internal failure" }, 500);
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expectOllamaError(
      client.generate({ prompt: "test" }),
      "unexpected"
    );
  });

  it("reports healthy dependency when the configured model is listed", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({
        models: [{ name: "scb10x/typhoon2.5-qwen3-4b" }]
      });
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expect(client.checkHealth()).resolves.toEqual({
      status: "ok",
      reachable: true,
      model: "scb10x/typhoon2.5-qwen3-4b",
      modelAvailable: true
    });
  });

  it("treats an untagged configured model as matching Ollama's latest tag", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({
        models: [{ name: "scb10x/typhoon2.5-qwen3-4b:latest" }]
      });
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expect(client.checkHealth()).resolves.toEqual({
      status: "ok",
      reachable: true,
      model: "scb10x/typhoon2.5-qwen3-4b",
      modelAvailable: true
    });
  });

  it("uses Ollama model field as a fallback when name is absent", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({
        models: [{ model: "scb10x/typhoon2.5-qwen3-4b:latest" }]
      });
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expect(client.checkHealth()).resolves.toMatchObject({
      status: "ok",
      modelAvailable: true
    });
  });

  it("reports missing model dependency health", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({ models: [{ name: "other-model" }] });
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expect(client.checkHealth()).resolves.toEqual({
      status: "missing_model",
      reachable: true,
      model: "scb10x/typhoon2.5-qwen3-4b",
      modelAvailable: false,
      error: "missing_model"
    });
  });

  it("reports malformed dependency health when tags response is not usable", async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({ response: "not a model list" });
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expect(client.checkHealth()).resolves.toEqual({
      status: "malformed_response",
      reachable: true,
      model: "scb10x/typhoon2.5-qwen3-4b",
      modelAvailable: false,
      error: "malformed_response"
    });
  });

  it("reports timeout dependency health distinctly from unavailable runtime", async () => {
    const fetchMock = vi.fn(async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    });
    const client = new OllamaClient({ ...baseOptions, fetch: fetchMock });

    await expect(client.checkHealth()).resolves.toEqual({
      status: "timeout",
      reachable: false,
      model: "scb10x/typhoon2.5-qwen3-4b",
      modelAvailable: false,
      error: "timeout"
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

async function expectOllamaError(
  promise: Promise<unknown>,
  code: OllamaError["code"]
): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    name: "OllamaError",
    code
  });
}
