import type { Request, Response } from "express";
import type { AppConfig } from "../config.js";
import { createErrorResponse } from "../errors.js";
import type { AnalysisService } from "./analysisService.js";
import type { AnalysisRequest } from "./types.js";

export function createAnalyzeHandler(
  config: AppConfig,
  service: AnalysisService
) {
  return async function analyzeHandler(
    req: Request,
    res: Response
  ): Promise<void> {
    const body = req.body as Record<string, unknown>;

    if (
      typeof body.scenario !== "string" ||
      body.scenario.trim().length === 0
    ) {
      res
        .status(400)
        .json(
          createErrorResponse(
            "VALIDATION_ERROR",
            "scenario is required and must be a non-empty string"
          )
        );
      return;
    }

    if (body.scenario.trim().length > config.maxScenarioLength) {
      res
        .status(400)
        .json(
          createErrorResponse(
            "VALIDATION_ERROR",
            `scenario must not exceed ${config.maxScenarioLength} characters`
          )
        );
      return;
    }

    const request: AnalysisRequest = {
      scenario: body.scenario.trim(),
      language: typeof body.language === "string" ? body.language : undefined
    };

    try {
      const result = await service.analyze(request);
      res.status(200).json(result);
    } catch {
      res
        .status(500)
        .json(createErrorResponse("INTERNAL_SERVER_ERROR", "Analysis failed"));
    }
  };
}
