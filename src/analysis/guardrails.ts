import type {
  AnalysisResponse,
  RiskLevel,
  ScamCategory
} from "./responseTypes.js";

interface GuardrailRule {
  pattern: RegExp;
  riskLevel: RiskLevel;
  category: ScamCategory;
  guidance: string;
}

const RULES: GuardrailRule[] = [
  {
    pattern:
      /\b(otp|one[-\s]?time password|password|passcode|recovery code|login code|verification code)\b/i,
    riskLevel: "critical",
    category: "phishing_link",
    guidance:
      "Do not share OTPs, passwords, recovery codes, login codes, or account access with unverified parties. Stop the interaction, secure your account, change passwords immediately, and contact the real organization through official channels."
  },
  {
    pattern:
      /\b(transfer|wire|send money|payment|pay|deposit|bank transfer|โอนเงิน)\b/i,
    riskLevel: "critical",
    category: "mule_account",
    guidance:
      "pause before sending money, verify through official channels, preserve evidence, and contact your bank before taking further action."
  },
  {
    pattern:
      /\b(already|sent|transferred|paid).*\b(money|payment|transfer|deposit|โอนเงิน)\b/i,
    riskLevel: "critical",
    category: "mule_account",
    guidance:
      "If money was already sent, contact your bank immediately, save transaction records, preserve messages, and report the incident through trusted local channels."
  },
  {
    pattern:
      /\b(already|shared|gave|sent).*\b(password|otp|recovery code|login code|account access)\b/i,
    riskLevel: "critical",
    category: "phishing_link",
    guidance:
      "If credentials were already shared, change passwords immediately, revoke sessions, enable multi-factor authentication, and contact the real service provider."
  },
  {
    pattern:
      /\b(remote access|anydesk|teamviewer|screen share|installed|install|app|apk)\b/i,
    riskLevel: "critical",
    category: "phishing_link",
    guidance:
      "If a suspicious app or remote access tool was installed, disconnect the device from the network, uninstall suspicious apps, scan the device, and secure important accounts from another trusted device."
  },
  {
    pattern:
      /\b(national id|passport|identity document|id card|bank book|driver'?s license)\b/i,
    riskLevel: "high",
    category: "impersonation_authority",
    guidance:
      "Do not send identity documents to unverified parties. Only provide documents through a verified official channel after independently confirming the request."
  },
  {
    pattern: /\b(blackmail|sextortion|private photos|private video|leak|expose)\b/i,
    riskLevel: "critical",
    category: "other",
    guidance:
      "For blackmail or sextortion, do not pay, preserve evidence, stop direct communication, and seek help from trusted people or local authorities."
  }
];

const RISK_ORDER: RiskLevel[] = ["safe", "low", "medium", "high", "critical"];

export function applySafetyGuardrails(
  response: AnalysisResponse,
  scenario: string
): AnalysisResponse {
  const evidence = `${scenario}\n${response.explanation}`;
  const matchedRules = RULES.filter((rule) => rule.pattern.test(evidence));

  if (matchedRules.length === 0) {
    return response;
  }

  const strongestRisk = matchedRules.reduce(
    (risk, rule) => maxRisk(risk, rule.riskLevel),
    response.riskLevel
  );
  const strongestRule = matchedRules.reduce((selected, rule) =>
    compareRisk(rule.riskLevel, selected.riskLevel) > 0 ? rule : selected
  );

  return {
    ...response,
    isScam: true,
    riskLevel: strongestRisk,
    confidence: Math.max(response.confidence, 0.8),
    category:
      response.category === "not_scam" || response.category === "other"
        ? strongestRule.category
        : response.category,
    explanation: mergeGuidance(response.explanation, matchedRules)
  };
}

function mergeGuidance(
  explanation: string,
  matchedRules: GuardrailRule[]
): string {
  const guidance = matchedRules.map((rule) => rule.guidance);
  const uniqueGuidance = Array.from(new Set(guidance));

  return [explanation.trim(), ...uniqueGuidance]
    .filter((part) => part.length > 0)
    .join(" ");
}

function maxRisk(left: RiskLevel, right: RiskLevel): RiskLevel {
  return compareRisk(left, right) >= 0 ? left : right;
}

function compareRisk(left: RiskLevel, right: RiskLevel): number {
  return RISK_ORDER.indexOf(left) - RISK_ORDER.indexOf(right);
}
