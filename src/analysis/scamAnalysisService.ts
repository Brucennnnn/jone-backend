import { OllamaError } from "../ollama.js";
import { applySafetyGuardrails } from "./guardrails.js";
import { buildAnalysisPrompt } from "./promptBuilder.js";
import { normalizeModelResponse } from "./responseNormalizer.js";
import type { AnalysisService } from "./service.js";
import type { AnalysisRequest, AnalysisResponse } from "./responseTypes.js";

export interface ModelClient {
  generate(input: { prompt: string }): Promise<string>;
}

export function createScamAnalysisService(
  modelClient: ModelClient
): AnalysisService {
  return {
    async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
      try {
        const prompt = buildAnalysisPrompt(request.intake, request.language);
        const modelOutput = await modelClient.generate({ prompt });
        const normalized = normalizeModelResponse(modelOutput);

        return applySafetyGuardrails(normalized, request.intake.scenario);
      } catch (error) {
        if (error instanceof OllamaError) {
          throw error;
        }

        throw error;
      }
    }
  };
}
