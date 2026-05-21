export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppConfig {
  host: string;
  port: number;
  ollamaBaseUrl: string;
  ollamaModel: string;
  ollamaTemperature: number;
  requestTimeoutMs: number;
  maxScenarioLength: number;
  logLevel: LogLevel;
}

const DEFAULT_CONFIG: AppConfig = {
  host: "0.0.0.0",
  port: 3000,
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "scb10x/typhoon2.5-qwen3-4b",
  ollamaTemperature: 0,
  requestTimeoutMs: 30_000,
  maxScenarioLength: 12_000,
  logLevel: "info"
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    host: readString(env.HOST, DEFAULT_CONFIG.host),
    port: readPositiveInteger(env.PORT, DEFAULT_CONFIG.port),
    ollamaBaseUrl: readString(env.OLLAMA_BASE_URL, DEFAULT_CONFIG.ollamaBaseUrl),
    ollamaModel: readModelName(env.OLLAMA_MODEL, DEFAULT_CONFIG.ollamaModel),
    ollamaTemperature: readNumberInRange(
      env.OLLAMA_TEMPERATURE,
      DEFAULT_CONFIG.ollamaTemperature,
      0,
      2
    ),
    requestTimeoutMs: readPositiveInteger(
      env.REQUEST_TIMEOUT_MS,
      DEFAULT_CONFIG.requestTimeoutMs
    ),
    maxScenarioLength: readPositiveInteger(
      env.MAX_SCENARIO_LENGTH,
      DEFAULT_CONFIG.maxScenarioLength
    ),
    logLevel: readLogLevel(env.LOG_LEVEL, DEFAULT_CONFIG.logLevel)
  };
}

function readString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function readModelName(value: string | undefined, fallback: string): string {
  const sanitized = value?.replace(/\s+/g, "");
  return readString(sanitized, fallback);
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function readNumberInRange(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return fallback;
  }

  return parsed;
}

function readLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  if (
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error"
  ) {
    return value;
  }

  return fallback;
}
