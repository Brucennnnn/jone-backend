import { Router, type Request, type Response } from "express";
import type { AppConfig } from "../config.js";
import type { AnalysisService } from "./service.js";
import { handleAnalyzeRequest } from "./handler.js";

export function createAnalysisRoutes(
  config: AppConfig,
  service: AnalysisService
): Router {
  const router = Router();
  const handler = async (request: Request, response: Response) => {
    const result = await handleAnalyzeRequest(request.body, config, service);
    response.status(result.statusCode).json(result.body);
  };

  router.post("/api/v1/scam/analyze", handler);

  return router;
}
