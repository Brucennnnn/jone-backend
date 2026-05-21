export const CHANNELS = [
  "sms",
  "email",
  "line",
  "facebook",
  "phone",
  "other"
] as const;

export type Channel = (typeof CHANNELS)[number];

export interface NormalizedIntake {
  scenario: string;
  context: {
    messageExcerpts: string[];
    channel: Channel | null;
    suspectedActor: string | null;
    requestedAction: string | null;
    requestedPaymentAmount: string | null;
    deadlineOrUrgency: string | null;
    alreadyTakenActions: string[];
    userConcern: string | null;
  };
}

export interface ValidationFailure {
  field: string;
  message: string;
}
