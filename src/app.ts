import express, { type Express } from "express";
import type { AnalysisService } from "./analysis/analysisService.js";
import { createAnalysisRoutes } from "./analysis/routes.js";
import type { AppConfig } from "./config.js";
import {
  createDependencyHealthResponse,
  createHealthResponse,
  type DependencyHealthClient
} from "./health.js";
import { OllamaClient } from "./ollama.js";

export interface AppDependencies {
  ollamaClient?: DependencyHealthClient;
  analysisService: AnalysisService;
}

export function createApp(
  config: AppConfig,
  dependencies: AppDependencies
): Express {
  const app = express();
  const ollamaClient =
    dependencies.ollamaClient ?? OllamaClient.fromConfig(config);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json(createHealthResponse(config));
  });

  app.get("/health/dependencies", async (_request, response) => {
    const health = await createDependencyHealthResponse(ollamaClient);
    const statusCode = health.status === "ok" ? 200 : 503;

    response.status(statusCode).json(health);
  });

  app.use(createAnalysisRoutes(config, dependencies.analysisService));

  return app;
}
