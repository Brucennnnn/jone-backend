import type { AppConfig } from "./config.js";

export type OllamaErrorCode =
  | "unavailable"
  | "missing_model"
  | "timeout"
  | "malformed_response"
  | "unexpected";

export class OllamaError extends Error {
  constructor(
    public readonly code: OllamaErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "OllamaError";
  }
}

export interface OllamaClientOptions {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  fetch: typeof fetch;
}

export interface GenerateInput {
  prompt: string;
}

export interface DependencyHealth {
  status: "ok" | OllamaErrorCode;
  reachable: boolean;
  model: string;
  modelAvailable: boolean;
  error?: OllamaErrorCode;
}

interface OllamaGenerateResponse {
  response?: unknown;
  error?: unknown;
}

interface OllamaTagsResponse {
  models?: unknown;
}

export class OllamaClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OllamaClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
    this.fetchImpl = options.fetch;
  }

  static fromConfig(
    config: AppConfig,
    fetchImpl: typeof fetch = fetch
  ): OllamaClient {
    return new OllamaClient({
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
      timeoutMs: config.requestTimeoutMs,
      fetch: fetchImpl
    });
  }

  async generate(input: GenerateInput): Promise<string> {
    const response = await this.request("/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        prompt: input.prompt,
        stream: false
      })
    });

    const body = await parseJson<OllamaGenerateResponse>(response);

    if (typeof body.response !== "string") {
      throw new OllamaError(
        "malformed_response",
        "Ollama generation response did not include model text"
      );
    }

    return body.response;
  }

  async checkHealth(): Promise<DependencyHealth> {
    try {
      const response = await this.request("/api/tags", { method: "GET" });
      const body = await parseJson<OllamaTagsResponse>(response);

      if (!Array.isArray(body.models)) {
        throw new OllamaError(
          "malformed_response",
          "Ollama tags response did not include a model list"
        );
      }

      const modelAvailable = body.models.some((model) => {
        return (
          typeof model === "object" &&
          model !== null &&
          "name" in model &&
          model.name === this.model
        );
      });

      if (!modelAvailable) {
        return {
          status: "missing_model",
          reachable: true,
          model: this.model,
          modelAvailable: false,
          error: "missing_model"
        };
      }

      return {
        status: "ok",
        reachable: true,
        model: this.model,
        modelAvailable: true
      };
    } catch (error) {
      const mapped = mapUnknownError(error);

      return {
        status: mapped.code,
        reachable: isReachableFailure(mapped.code),
        model: this.model,
        modelAvailable: false,
        error: mapped.code
      };
    }
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal
      });

      if (!response.ok) {
        await throwForBadResponse(response);
      }

      return response;
    } catch (error) {
      throw mapUnknownError(error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new OllamaError(
      "malformed_response",
      "Ollama response body was not valid JSON",
      error
    );
  }
}

async function throwForBadResponse(response: Response): Promise<never> {
  const body = await safeReadErrorBody(response);
  const lowerBody = body.toLowerCase();

  if (response.status === 404 || lowerBody.includes("model")) {
    throw new OllamaError(
      "missing_model",
      "Configured Ollama model is not available"
    );
  }

  throw new OllamaError(
    "unexpected",
    `Ollama returned HTTP ${response.status}`
  );
}

async function safeReadErrorBody(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    return "";
  }

  return "";
}

function mapUnknownError(error: unknown): OllamaError {
  if (error instanceof OllamaError) {
    return error;
  }

  if (isAbortError(error)) {
    return new OllamaError("timeout", "Ollama request timed out", error);
  }

  if (error instanceof TypeError) {
    return new OllamaError(
      "unavailable",
      "Ollama runtime is unavailable",
      error
    );
  }

  return new OllamaError("unexpected", "Unexpected Ollama failure", error);
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.includes("aborted"))
  );
}

function isReachableFailure(code: OllamaErrorCode): boolean {
  return (
    code === "missing_model" ||
    code === "malformed_response" ||
    code === "unexpected"
  );
}
