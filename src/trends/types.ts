import type { ScamCategory } from "../analysis/responseTypes.js";

export interface ScamTypeTrend {
  category: ScamCategory;
  count: number;
}

export interface CommonPhraseTrend {
  phrase: string;
  count: number;
}

export interface TrendResponse {
  scamTypes: ScamTypeTrend[];
  commonPhrases: CommonPhraseTrend[];
}
