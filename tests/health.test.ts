import { describe, expect, it } from "vitest";
import { createFakeAnalysisService } from "../src/analysis/fakeAnalysisService.js";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import {
  createDependencyHealthResponse,
  createHealthResponse
} from "../src/health.js";
import type { DependencyHealth } from "../src/ollama.js";

describe("health foundation", () => {
  it("creates the Express app without binding a port", () => {
    const app = createApp(loadConfig({ OLLAMA_MODEL: "test-model" }), {
      analysisService: createFakeAnalysisService()
    });

    expect(app.listen).toBeTypeOf("function");
  });

  it("returns process health payload", () => {
    const payload = createHealthResponse(
      loadConfig({ OLLAMA_MODEL: "test-model" })
    );

    expect(payload).toEqual({
      status: "ok",
      service: "jone-backend",
      model: "test-model"
    });
  });

  it("returns dependency health details from the Ollama client", async () => {
    const ollamaClient = {
      checkHealth: async (): Promise<DependencyHealth> => ({
        status: "ok",
        reachable: true,
        model: "test-model",
        modelAvailable: true
      })
    };

    await expect(createDependencyHealthResponse(ollamaClient)).resolves.toEqual(
      {
        status: "ok",
        reachable: true,
        model: "test-model",
        modelAvailable: true
      }
    );
  });
});
