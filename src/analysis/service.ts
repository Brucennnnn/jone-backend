import type { AnalysisRequest, AnalysisResponse } from "./responseTypes.js";

export interface AnalysisService {
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>;
}
