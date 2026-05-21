import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createHealthResponse } from "../src/health.js";

describe("health foundation", () => {
  it("creates the Express app without binding a port", () => {
    const app = createApp(loadConfig({ OLLAMA_MODEL: "test-model" }));

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
});
