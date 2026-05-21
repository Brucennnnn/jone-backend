import type { TrendService } from "./service.js";
import type { TrendResponse } from "./types.js";

const STATIC_TRENDS: TrendResponse = {
  scamTypes: [
    { category: "call_center", count: 45 },
    { category: "romance_scam", count: 32 },
    { category: "phishing_link", count: 28 },
    { category: "investment_fraud", count: 21 },
    { category: "job_scam", count: 14 }
  ],
  commonPhrases: [
    { phrase: "โอนด่วน", count: 78 },
    { phrase: "ตรวจสอบ 2 ชั้น", count: 56 },
    { phrase: "บัญชีจะถูกระงับ", count: 43 },
    { phrase: "ส่ง OTP", count: 39 },
    { phrase: "ผลตอบแทนสูง", count: 26 }
  ]
};

export function createStaticTrendService(): TrendService {
  return {
    async getTrends(): Promise<TrendResponse> {
      return structuredClone(STATIC_TRENDS);
    }
  };
}
