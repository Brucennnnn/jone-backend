import type { AnalysisService } from "./analysisService.js";
import type { AnalysisRequest, AnalysisResponse } from "./types.js";

export interface FakeAnalysisServiceOptions {
  response?: Partial<AnalysisResponse>;
  error?: Error;
}

const DEFAULT_SCAM_RESPONSE: AnalysisResponse = {
  isScam: true,
  riskLevel: "high",
  confidence: 0.92,
  category: "call_center",
  explanation:
    "ข้อความนี้มีลักษณะของการหลอกลวงจากแก๊งคอลเซ็นเตอร์ ไม่ควรโอนเงินหรือให้ข้อมูลส่วนตัว และควรแจ้งความที่สายด่วน 1599"
};

const DEFAULT_SAFE_RESPONSE: AnalysisResponse = {
  isScam: false,
  riskLevel: "safe",
  confidence: 0.95,
  category: "not_scam",
  explanation:
    "ข้อความนี้ไม่มีสัญญาณของการหลอกลวง สามารถดำเนินการได้ตามปกติ"
};

export function createFakeAnalysisService(
  options: FakeAnalysisServiceOptions = {}
): AnalysisService {
  return {
    async analyze(_request: AnalysisRequest): Promise<AnalysisResponse> {
      if (options.error) {
        throw options.error;
      }

      const base =
        options.response?.isScam === false
          ? DEFAULT_SAFE_RESPONSE
          : DEFAULT_SCAM_RESPONSE;

      return { ...base, ...options.response };
    }
  };
}
