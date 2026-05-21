import express, { type Express } from "express";
import type { AppConfig } from "./config.js";
import { createHealthResponse } from "./health.js";

export function createApp(config: AppConfig): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json(createHealthResponse(config));
  });

  return app;
}
