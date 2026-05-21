import type { AnalysisService } from "./analysisService.js";

export function createUnavailableAnalysisService(): AnalysisService {
  return {
    async analyze(): Promise<never> {
      throw new Error("Analysis service is not configured");
    }
  };
}
