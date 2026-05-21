import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("uses sensible local defaults", () => {
    expect(loadConfig({})).toEqual({
      host: "0.0.0.0",
      port: 3000,
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "scb10x/typhoon2.5-qwen3-4b",
      ollamaTemperature: 0,
      requestTimeoutMs: 30_000,
      maxScenarioLength: 12_000,
      logLevel: "info"
    });
  });

  it("reads supported environment overrides", () => {
    expect(
      loadConfig({
        HOST: "127.0.0.1",
        PORT: "8080",
        OLLAMA_BASE_URL: "http://ollama.local:11434",
        OLLAMA_MODEL: "custom-model",
        OLLAMA_TEMPERATURE: "0.2",
        REQUEST_TIMEOUT_MS: "5000",
        MAX_SCENARIO_LENGTH: "1000",
        LOG_LEVEL: "debug"
      })
    ).toMatchObject({
      host: "127.0.0.1",
      port: 8080,
      ollamaBaseUrl: "http://ollama.local:11434",
      ollamaModel: "custom-model",
      ollamaTemperature: 0.2,
      requestTimeoutMs: 5000,
      maxScenarioLength: 1000,
      logLevel: "debug"
    });
  });

  it("removes whitespace accidentally copied into the Ollama model name", () => {
    expect(
      loadConfig({
        OLLAMA_MODEL:
          "hf.co/mradermacher/typhoon-s-thaillm-8b-instruct-research-preview-i1-\n  GGUF:Q4_K_M"
      }).ollamaModel
    ).toBe(
      "hf.co/mradermacher/typhoon-s-thaillm-8b-instruct-research-preview-i1-GGUF:Q4_K_M"
    );
  });

  it("falls back to default Ollama temperature when outside supported range", () => {
    expect(loadConfig({ OLLAMA_TEMPERATURE: "-1" }).ollamaTemperature).toBe(0);
    expect(loadConfig({ OLLAMA_TEMPERATURE: "3" }).ollamaTemperature).toBe(0);
    expect(loadConfig({ OLLAMA_TEMPERATURE: "random" }).ollamaTemperature).toBe(0);
  });
});
