export type ErrorCode =
  | "VALIDATION_ERROR"
  | "MODEL_UNAVAILABLE"
  | "MODEL_TIMEOUT"
  | "MODEL_RESPONSE_ERROR"
  | "INTERNAL_SERVER_ERROR";

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
  };
}

export function createErrorResponse(
  code: ErrorCode,
  message: string
): ErrorResponse {
  return { error: { code, message } };
}
