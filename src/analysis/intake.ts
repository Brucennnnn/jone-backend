import type { AppConfig } from "../config.js";
import {
  CHANNELS,
  type Channel,
  type NormalizedIntake,
  type ValidationFailure
} from "./intakeTypes.js";

export type IntakeResult =
  | { ok: true; intake: NormalizedIntake }
  | { ok: false; failure: ValidationFailure };

export function parseAndValidate(
  body: unknown,
  config: Pick<AppConfig, "maxScenarioLength">
): IntakeResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return fail("body", "Request body must be a JSON object");
  }

  const raw = body as Record<string, unknown>;

  if (raw.scenario === undefined || raw.scenario === null) {
    return fail("scenario", "scenario is required");
  }

  if (typeof raw.scenario !== "string") {
    return fail("scenario", "scenario must be a string");
  }

  const scenario = raw.scenario.trim();

  if (scenario.length === 0) {
    return fail("scenario", "scenario must not be empty");
  }

  if (scenario.length > config.maxScenarioLength) {
    return fail("scenario", `scenario must not exceed ${config.maxScenarioLength} characters`);
  }

  let channel: Channel | null = null;
  let messageExcerpts: string[] = [];
  let suspectedActor: string | null = null;
  let requestedAction: string | null = null;
  let requestedPaymentAmount: string | null = null;
  let deadlineOrUrgency: string | null = null;
  let alreadyTakenActions: string[] = [];
  let userConcern: string | null = null;

  if (raw.context !== undefined) {
    if (typeof raw.context !== "object" || raw.context === null || Array.isArray(raw.context)) {
      return fail("context", "context must be an object");
    }

    const ctx = raw.context as Record<string, unknown>;

    if (ctx.channel !== undefined) {
      if (typeof ctx.channel !== "string") {
        return fail("context.channel", "context.channel must be a string");
      }
      if (!(CHANNELS as readonly string[]).includes(ctx.channel)) {
        return fail(
          "context.channel",
          `context.channel must be one of: ${CHANNELS.join(", ")}`
        );
      }
      channel = ctx.channel as Channel;
    }

    if (ctx.messageExcerpts !== undefined) {
      if (!isStringArray(ctx.messageExcerpts)) {
        return fail("context.messageExcerpts", "context.messageExcerpts must be an array of strings");
      }
      messageExcerpts = ctx.messageExcerpts;
    }

    if (ctx.alreadyTakenActions !== undefined) {
      if (!isStringArray(ctx.alreadyTakenActions)) {
        return fail(
          "context.alreadyTakenActions",
          "context.alreadyTakenActions must be an array of strings"
        );
      }
      alreadyTakenActions = ctx.alreadyTakenActions;
    }

    suspectedActor = normalizeOptionalString(ctx.suspectedActor);
    requestedAction = normalizeOptionalString(ctx.requestedAction);
    requestedPaymentAmount = normalizeOptionalString(ctx.requestedPaymentAmount);
    deadlineOrUrgency = normalizeOptionalString(ctx.deadlineOrUrgency);
    userConcern = normalizeOptionalString(ctx.userConcern);
  }

  return {
    ok: true,
    intake: {
      scenario,
      context: {
        messageExcerpts,
        channel,
        suspectedActor,
        requestedAction,
        requestedPaymentAmount,
        deadlineOrUrgency,
        alreadyTakenActions,
        userConcern
      }
    }
  };
}

function fail(field: string, message: string): { ok: false; failure: ValidationFailure } {
  return { ok: false, failure: { field, message } };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}
