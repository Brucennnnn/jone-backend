import type { NormalizedIntake } from "./requestTypes.js";
import { RISK_LEVELS, SCAM_CATEGORIES } from "./responseTypes.js";

export function buildAnalysisPrompt(intake: NormalizedIntake, language?: string): string {
  return [systemSection(), "---", scenarioSection(intake, language)].join("\n\n");
}

function systemSection(): string {
  return `You are a scam-detection assistant helping users identify potential fraud.

Analyse the scenario and respond with a JSON object only, matching this exact schema:
{
  "isScam": boolean,
  "riskLevel": one of ${JSON.stringify(RISK_LEVELS)},
  "confidence": number between 0.0 and 1.0,
  "category": one of ${JSON.stringify(SCAM_CATEGORIES)},
  "explanation": string
}

Uncertainty rule: when evidence is incomplete, keep confidence below 0.7 and hedge your explanation with "likely" or "possibly" rather than asserting certainty.

Safety priorities to address in your explanation when relevant:
- Pause: advise the user to pause before taking any action
- Verify: confirm information only through official channels, not through numbers or links provided by the contact
- Do not pay: warn against any payment, transfer, or advance fee
- Do not share: warn against sharing OTPs, passwords, PINs, or personal documents
- Secure accounts: advise securing accounts if credentials may have been compromised
- Preserve evidence: advise keeping screenshots and message records
- Report: guide toward reporting to the bank hotline, DSI, or police (1599 or 191) when appropriate

Language rule: detect the language of the scenario and write the "explanation" in that same language only — Thai if the scenario is in Thai, English otherwise. Do not mix languages.

Respond with JSON only. No markdown fences, no text outside the JSON object.`;
}

function scenarioSection(intake: NormalizedIntake, language?: string): string {
  const lines: string[] = ["SCENARIO:", intake.scenario];

  const contextLines = buildContextLines(intake.context);
  if (contextLines.length > 0) {
    lines.push("", "CONTEXT:", ...contextLines);
  }

  if (language) {
    lines.push("", `Respond in: ${language}`);
  }

  return lines.join("\n");
}

function buildContextLines(ctx: NormalizedIntake["context"]): string[] {
  const lines: string[] = [];

  if (ctx.channel) lines.push(`Channel: ${ctx.channel}`);
  if (ctx.suspectedActor) lines.push(`Suspected actor: ${ctx.suspectedActor}`);
  if (ctx.requestedAction) lines.push(`Requested action: ${ctx.requestedAction}`);
  if (ctx.requestedPaymentAmount) lines.push(`Requested payment: ${ctx.requestedPaymentAmount}`);
  if (ctx.deadlineOrUrgency) lines.push(`Deadline or urgency: ${ctx.deadlineOrUrgency}`);
  if (ctx.userConcern) lines.push(`User concern: ${ctx.userConcern}`);

  if (ctx.messageExcerpts.length > 0) {
    lines.push(`Message excerpts:\n${ctx.messageExcerpts.map((e) => `- ${e}`).join("\n")}`);
  }

  if (ctx.alreadyTakenActions.length > 0) {
    lines.push(
      `Already taken actions:\n${ctx.alreadyTakenActions.map((a) => `- ${a}`).join("\n")}`
    );
  }

  return lines;
}
