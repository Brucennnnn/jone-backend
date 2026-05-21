import type { AnalysisResponse } from "../analysis/responseTypes.js";
import type { NormalizedIntake } from "../analysis/requestTypes.js";
import type { TrendResponse } from "./types.js";

export interface TrendService {
  getTrends(): Promise<TrendResponse>;
}

export interface TrendRecorder {
  recordAnalysis(intake: NormalizedIntake, response: AnalysisResponse): void;
}

export type TrendStore = TrendService & TrendRecorder;
