import type { AnalysisRequest, AnalysisResponse } from "./resultTypes.js";

export interface AnalysisService {
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>;
}
