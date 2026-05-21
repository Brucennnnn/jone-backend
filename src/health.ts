import type { AppConfig } from "./config.js";

export interface HealthResponse {
  status: "ok";
  service: "jone-backend";
  model: string;
}

export function createHealthResponse(config: AppConfig): HealthResponse {
  return {
    status: "ok",
    service: "jone-backend",
    model: config.ollamaModel
  };
}
