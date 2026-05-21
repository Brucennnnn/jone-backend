import type { AppConfig } from "./config.js";
import type { DependencyHealth } from "./ollama.js";

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

export interface DependencyHealthClient {
  checkHealth(): Promise<DependencyHealth>;
}

export async function createDependencyHealthResponse(
  client: DependencyHealthClient
): Promise<DependencyHealth> {
  return client.checkHealth();
}
