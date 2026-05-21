# Jone Backend

Backend-only Express service for scam scenario analysis. It runs against a local Ollama model and does not require any external AI API key.

## Requirements

- Node.js 22 or newer
- npm
- Ollama, for local model-backed analysis

## Install

```bash
npm install
```

## Configuration

The server reads configuration from environment variables.

| Variable | Default |
| --- | --- |
| `HOST` | `0.0.0.0` |
| `PORT` | `3000` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` |
| `OLLAMA_MODEL` | `scb10x/typhoon2.5-qwen3-4b` |
| `OLLAMA_TEMPERATURE` | `0` |
| `REQUEST_TIMEOUT_MS` | `30000` |
| `MAX_SCENARIO_LENGTH` | `12000` |
| `LOG_LEVEL` | `info` |

`OLLAMA_TEMPERATURE` is sent to Ollama generation options. Keep it at `0` for the most repeatable scam analysis responses.

## Run Ollama

Start Ollama if it is not already running:

```bash
ollama serve
```

Pull or run the configured model:

```bash
ollama pull scb10x/typhoon2.5-qwen3-4b
```

or:

```bash
ollama run scb10x/typhoon2.5-qwen3-4b
```

Ollama may list the model as `scb10x/typhoon2.5-qwen3-4b:latest`; the backend health check treats that as matching the default untagged model name.

## Run The Server

```bash
npm run dev
```

With explicit Ollama configuration:

```bash
OLLAMA_BASE_URL=http://localhost:11434 \
OLLAMA_MODEL=scb10x/typhoon2.5-qwen3-4b \
OLLAMA_TEMPERATURE=0 \
npm run dev
```

The server listens on `http://localhost:3000` by default.

## Health Checks

Process health:

```bash
curl http://localhost:3000/health
```

Ollama dependency health:

```bash
curl http://localhost:3000/health/dependencies
```

Expected dependency health when Ollama is ready:

```json
{
  "status": "ok",
  "reachable": true,
  "model": "scb10x/typhoon2.5-qwen3-4b",
  "modelAvailable": true
}
```

## Analyze A Scenario

```bash
curl -s http://localhost:3000/api/v1/scam/analyze \
  -H 'content-type: application/json' \
  -d '{
    "scenario": "Someone claiming to be my bank sent a link and asked for my OTP.",
    "context": {
      "channel": "sms",
      "requestedAction": "Open a link and share OTP",
      "deadlineOrUrgency": "Immediately"
    },
    "language": "en"
  }'
```

## Tests

Default automated tests do not require a live Ollama model.

```bash
npm test
```

TypeScript build:

```bash
npm run build
```

## Optional Ollama Smoke Check

This is a manual check and is not part of the default test command.

Prerequisites:

1. Ollama is running.
2. `scb10x/typhoon2.5-qwen3-4b` is available locally.
3. The backend server is running.

Run:

```bash
npm run smoke:ollama
```

Use `JONE_BASE_URL` if the server is not on `http://localhost:3000`:

```bash
JONE_BASE_URL=http://localhost:3001 npm run smoke:ollama
```
