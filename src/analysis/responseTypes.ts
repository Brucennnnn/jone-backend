import type { NormalizedIntake } from "./requestTypes.js";

export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export type ScamCategory =
  | "call_center"
  | "impersonation_authority"
  | "impersonation_family"
  | "impersonation_friend"
  | "romance_scam"
  | "investment_fraud"
  | "parcel_delivery"
  | "tax_refund"
  | "fake_loan"
  | "phishing_link"
  | "job_scam"
  | "charity_scam"
  | "mule_account"
  | "crypto_scam"
  | "not_scam"
  | "other";

export const RISK_LEVELS: RiskLevel[] = [
  "safe",
  "low",
  "medium",
  "high",
  "critical"
];

export const SCAM_CATEGORIES: ScamCategory[] = [
  "call_center",
  "impersonation_authority",
  "impersonation_family",
  "impersonation_friend",
  "romance_scam",
  "investment_fraud",
  "parcel_delivery",
  "tax_refund",
  "fake_loan",
  "phishing_link",
  "job_scam",
  "charity_scam",
  "mule_account",
  "crypto_scam",
  "not_scam",
  "other"
];

export interface AnalysisRequest {
  intake: NormalizedIntake;
  language?: string;
}

export interface AnalysisResponse {
  isScam: boolean;
  riskLevel: RiskLevel;
  confidence: number;
  category: ScamCategory;
  explanation: string;
}
