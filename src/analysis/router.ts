import { Router, type Request, type Response } from "express";
import type { AppConfig } from "../config.js";
import type { AnalysisService } from "./analysisService.js";
import {
  handleAnalyzeRequest,
  type AnalyzeResult
} from "./analyzeHandler.js";

export type AnalysisRouteResult = AnalyzeResult;

export function createAnalysisRouter(
  config: AppConfig,
  service: AnalysisService
): Router {
  const router = Router();

  router.post("/", async (request: Request, response: Response) => {
    const result = await handleAnalysisRequest(request.body, config, service);
    response.status(result.statusCode).json(result.body);
  });

  return router;
}

export function handleAnalysisRequest(
  body: unknown,
  config: AppConfig,
  service: AnalysisService
): Promise<AnalysisRouteResult> {
  return handleAnalyzeRequest(body, config, service);
}
