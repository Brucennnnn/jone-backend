import type { TrendResponse } from "./types.js";

export interface TrendService {
  getTrends(): Promise<TrendResponse>;
}
