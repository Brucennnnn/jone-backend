import type { AnalysisRequest, AnalysisResponse } from "./types.js";

export interface AnalysisService {
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>;
}
