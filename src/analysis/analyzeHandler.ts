import type { Request, Response } from "express";
import type { AppConfig } from "../config.js";
import { createErrorResponse } from "../errors.js";
import type { AnalysisService } from "./analysisService.js";
import { parseAndValidate } from "./intake.js";
import type { AnalysisRequest } from "./types.js";

export interface AnalyzeResult {
  statusCode: number;
  body: unknown;
}

export function createAnalyzeHandler(
  config: AppConfig,
  service: AnalysisService
) {
  return async function analyzeHandler(
    req: Request,
    res: Response
  ): Promise<void> {
    const result = await handleAnalyzeRequest(req.body, config, service);
    res.status(result.statusCode).json(result.body);
  };
}

export async function handleAnalyzeRequest(
  body: unknown,
  config: AppConfig,
  service: AnalysisService
): Promise<AnalyzeResult> {
  const intakeResult = parseAndValidate(body, config);

  if (!intakeResult.ok) {
    return {
      statusCode: 400,
      body: createErrorResponse("VALIDATION_ERROR", intakeResult.failure.message)
    };
  }

  const request: AnalysisRequest = {
    scenario: intakeResult.intake.scenario,
    language: readLanguage(body)
  };

  try {
    return { statusCode: 200, body: await service.analyze(request) };
  } catch {
    return {
      statusCode: 500,
      body: createErrorResponse("INTERNAL_SERVER_ERROR", "Analysis failed")
    };
  }
}

function readLanguage(body: unknown): string | undefined {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return undefined;
  }

  const raw = body as Record<string, unknown>;
  return typeof raw.language === "string" ? raw.language : undefined;
}
