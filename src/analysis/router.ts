import { Router, type Request, type Response } from "express";
import type { AppConfig } from "../config.js";
import { parseAndValidate } from "./intake.js";

export interface AnalysisRouteResult {
  statusCode: number;
  body: unknown;
}

export function createAnalysisRouter(config: AppConfig): Router {
  const router = Router();

  router.post("/", (request: Request, response: Response) => {
    const result = handleAnalysisRequest(request.body, config);
    response.status(result.statusCode).json(result.body);
  });

  return router;
}

export function handleAnalysisRequest(
  body: unknown,
  config: AppConfig
): AnalysisRouteResult {
  const result = parseAndValidate(body, config);

  if (!result.ok) {
    return {
      statusCode: 400,
      body: {
        error: "validation_error",
        field: result.failure.field,
        message: result.failure.message
      }
    };
  }

  // TODO: hand off to analysis service (issue #4)
  return { statusCode: 202, body: { status: "accepted" } };
}
