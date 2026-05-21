import type { Request, Response } from "express";
import type { AppConfig } from "../config.js";
import { createErrorResponse } from "../errors.js";
import { OllamaError } from "../ollama.js";
import type { TrendRecorder } from "../trends/service.js";
import type { AnalysisService } from "./service.js";
import { parseAndValidate } from "./intake.js";
import type { AnalysisRequest, AnalysisResponse } from "./responseTypes.js";

export interface AnalyzeResult {
  statusCode: number;
  body: unknown;
}

export function createAnalyzeHandler(
  config: AppConfig,
  service: AnalysisService,
  trendRecorder?: TrendRecorder
) {
  return async function analyzeHandler(
    req: Request,
    res: Response
  ): Promise<void> {
    const result = await handleAnalyzeRequest(
      req.body,
      config,
      service,
      trendRecorder
    );
    res.status(result.statusCode).json(result.body);
  };
}

export async function handleAnalyzeRequest(
  body: unknown,
  config: AppConfig,
  service: AnalysisService,
  trendRecorder?: TrendRecorder
): Promise<AnalyzeResult> {
  const intakeResult = parseAndValidate(body, config);

  if (!intakeResult.ok) {
    return {
      statusCode: 400,
      body: createErrorResponse("VALIDATION_ERROR", intakeResult.failure.message)
    };
  }

  const request: AnalysisRequest = {
    intake: intakeResult.intake,
    language: readLanguage(body)
  };

  try {
    const response = await service.analyze(request);
    trendRecorder?.recordAnalysis(request.intake, response);

    return { statusCode: 200, body: response };
  } catch (error) {
    if (error instanceof OllamaError) {
      return mapOllamaError(error);
    }

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

function mapOllamaError(error: OllamaError): AnalyzeResult {
  switch (error.code) {
    case "unavailable":
    case "missing_model":
      return {
        statusCode: 503,
        body: createErrorResponse("MODEL_UNAVAILABLE", error.message)
      };
    case "timeout":
      return {
        statusCode: 504,
        body: createErrorResponse("MODEL_TIMEOUT", error.message)
      };
    case "malformed_response":
      return {
        statusCode: 502,
        body: createErrorResponse("MODEL_RESPONSE_ERROR", error.message)
      };
    case "unexpected":
      return {
        statusCode: 502,
        body: createErrorResponse("MODEL_RESPONSE_ERROR", error.message)
      };
  }
}
