# PRD: Jone AI Scam Prevention Backend

## Problem Statement

People who are being targeted by scams often do not know how to judge the situation while it is happening. They may receive suspicious messages, calls, payment requests, investment offers, romance requests, job offers, or account warnings, and need fast, practical advice before they share money, credentials, identity documents, or personal information.

Jone needs a backend-only service that accepts a user's scam scenario, analyzes the risk with a local AI model, and returns clear guidance. The system should help users understand whether the situation is likely a scam, why it is risky, what they should do next, and what information they should avoid sharing. The project should run as an Express server and use a local Ollama model, specifically `scb10x/typhoon2.5-qwen3-4b`, rather than a hosted AI provider.

## Solution

Build an Express backend for Jone that exposes API endpoints for scam scenario analysis. A client sends the scenario the user is handling, optionally with relevant context such as the suspected scam channel, requested action, amount of money, suspicious messages, urgency level, and user's concern. The backend validates the request, constructs a safety-focused prompt, calls the local Ollama model `scb10x/typhoon2.5-qwen3-4b`, parses the model output into a stable response contract, and returns actionable advice.

The response should include a risk classification, confidence, warning signs, recommended next steps, questions the user can ask themselves, recommended evidence to collect, and emergency actions when the scenario involves money transfer, credentials, identity documents, malware, or immediate personal safety risk.

The backend should be designed around a few deep modules that can be tested independently: scenario intake validation, scam risk analysis orchestration, Ollama model adapter, advice response normalization, and safety guardrails.

## User Stories

1. As a potentially targeted user, I want to describe a suspicious situation, so that I can get immediate guidance before I take action.
2. As a potentially targeted user, I want to paste suspicious messages, so that the system can analyze wording, urgency, links, and requests.
3. As a potentially targeted user, I want the system to classify the risk level, so that I can quickly understand how dangerous the situation is.
4. As a potentially targeted user, I want the system to explain why something looks suspicious, so that I can learn how to identify scams in the future.
5. As a potentially targeted user, I want practical next steps, so that I know what to do immediately.
6. As a potentially targeted user, I want the system to warn me before I send money, so that I can stop a harmful transaction.
7. As a potentially targeted user, I want the system to warn me before I share passwords, OTPs, recovery codes, or account access, so that I can protect my accounts.
8. As a potentially targeted user, I want the system to warn me before I share national ID, passport, bank book, or other identity documents, so that I can reduce identity theft risk.
9. As a potentially targeted user, I want the system to identify pressure tactics, so that I can notice when someone is rushing or threatening me.
10. As a potentially targeted user, I want the system to identify suspicious payment methods, so that I can avoid irreversible transfers.
11. As a potentially targeted user, I want the system to identify suspicious links or app installation requests, so that I can avoid phishing or malware.
12. As a potentially targeted user, I want the system to recommend what evidence to save, so that I can report the incident later.
13. As a potentially targeted user, I want the system to suggest who to contact, so that I can verify the request through trusted channels.
14. As a potentially targeted user, I want the system to tell me when to stop communication, so that I do not remain exposed to manipulation.
15. As a potentially targeted user, I want advice in plain language, so that I can understand it while stressed.
16. As a potentially targeted user, I want advice that does not blame me, so that I feel able to ask for help.
17. As a potentially targeted user, I want the system to ask for missing context only when needed, so that I can improve the analysis without unnecessary friction.
18. As a potentially targeted user, I want the system to handle short and incomplete scenarios, so that I can still receive useful first-step advice.
19. As a potentially targeted user, I want the system to handle long scenarios, so that I can include the full message history.
20. As a potentially targeted user, I want the system to separate facts from assumptions, so that I can see what the advice is based on.
21. As a potentially targeted user, I want the system to identify common scam types, so that I can compare my scenario with known patterns.
22. As a user facing a banking scam, I want urgent account-protection steps, so that I can reduce financial damage.
23. As a user facing an investment offer, I want warnings about unrealistic returns and transfer pressure, so that I can avoid fraudulent schemes.
24. As a user facing a romance scam, I want the system to identify emotional manipulation and money requests, so that I can step back safely.
25. As a user facing a job scam, I want the system to identify suspicious fees, document requests, and fake recruitment behavior, so that I can avoid exploitation.
26. As a user facing impersonation of police, government, bank, delivery, or platform staff, I want verification advice, so that I can contact the real organization directly.
27. As a user facing a marketplace scam, I want guidance about escrow, fake proof of payment, and off-platform communication, so that I can reduce transaction risk.
28. As a user facing blackmail or sextortion, I want calm emergency guidance, so that I know not to pay and can preserve evidence.
29. As a user who already sent money, I want recovery steps, so that I know whom to contact and what evidence to collect.
30. As a user who already shared credentials, I want account recovery steps, so that I can secure my accounts immediately.
31. As a user who already installed a suspicious app, I want device safety steps, so that I can reduce further compromise.
32. As a frontend developer, I want a stable analysis API, so that I can build a client without depending on model-specific response text.
33. As a frontend developer, I want machine-readable risk fields, so that the UI can show severity, warnings, and next actions consistently.
34. As a frontend developer, I want consistent error responses, so that the UI can handle validation failures and model availability issues.
35. As a backend developer, I want request validation, so that invalid or unsafe payloads are rejected predictably.
36. As a backend developer, I want the Ollama interaction behind an adapter, so that model details do not leak through the application.
37. As a backend developer, I want model response normalization, so that downstream clients get structured output even when the model is verbose or inconsistent.
38. As a backend developer, I want safety guardrails, so that the assistant does not encourage risky actions or overclaim certainty.
39. As a backend developer, I want health checks for the Express server and Ollama dependency, so that deployment and local development can detect readiness.
40. As a backend developer, I want clear configuration for host, port, Ollama URL, and model name, so that the service can run in different environments.
41. As a backend developer, I want timeout handling around model calls, so that requests do not hang indefinitely.
42. As a backend developer, I want logging around analysis requests without storing sensitive scenario text by default, so that debugging does not create unnecessary privacy risk.
43. As a hackathon team member, I want the backend to be simple to run locally, so that teammates can start the service quickly.
44. As a hackathon team member, I want the project to avoid external AI API keys, so that demos can run locally through Ollama.
45. As a project maintainer, I want focused tests around the deep modules, so that the highest-risk behavior is protected without slowing down iteration.

## Implementation Decisions

- Build a backend-only Express server. No frontend, mobile app, browser extension, or landing page is included in this PRD.
- Use Node.js with Express as the HTTP server framework.
- Use Ollama as the local model runtime.
- Use `scb10x/typhoon2.5-qwen3-4b` as the default model name.
- Keep the model name configurable through environment configuration while defaulting to `scb10x/typhoon2.5-qwen3-4b`.
- Expose a health endpoint that confirms the Express process is running.
- Expose a dependency health endpoint or health detail that checks whether Ollama is reachable and whether the configured model can be used.
- Expose a scenario analysis endpoint that accepts the user's scenario and optional structured context.
- Define the scenario analysis request around user-facing facts: scenario text, message excerpts, channel, suspected actor, requested action, requested payment amount, deadline or urgency, already-taken actions, and user concern.
- Validate the scenario analysis request before calling the model.
- Reject empty scenarios, oversized payloads, and invalid structured fields with a predictable error contract.
- Treat user-provided scenario text as sensitive. Do not log full scenario text by default.
- Create a scenario intake module that owns request validation and converts raw API input into a normalized scenario object.
- Create a scam analysis service as the main orchestration module. It should accept a normalized scenario and return a normalized analysis result.
- Create an Ollama adapter module that owns HTTP communication with Ollama, timeout behavior, model selection, and low-level error mapping.
- Create a prompt builder module that turns a normalized scenario into a consistent scam-prevention prompt for the local model.
- Create a response normalizer module that converts model output into the public API response structure.
- Create a safety guardrails module that enforces non-negotiable advice rules, such as never advising users to share OTPs, passwords, recovery codes, remote access, or identity documents with unverified parties.
- Prefer structured model output. The model should be prompted to return JSON that can be parsed, validated, and normalized.
- If model output is invalid JSON, attempt a bounded repair or fallback normalization rather than returning raw model text.
- The public analysis response should include risk level, confidence, scam type candidates, warning signs, recommended actions, do-not-do actions, evidence to collect, verification steps, and optional follow-up questions.
- Risk levels should be stable enum values suitable for UI rendering, such as `low`, `medium`, `high`, and `critical`.
- Confidence should be a bounded value or enum, not unconstrained prose.
- The system must avoid claiming certainty when evidence is incomplete.
- The advice should prioritize harm prevention: pause, verify through official channels, do not pay, do not share credentials, secure accounts, preserve evidence, and report when appropriate.
- The system should support Thai and English user scenarios if the local model handles them, but the backend contract should not depend on a single UI language.
- Errors from Ollama should be mapped into clear API errors, including unavailable runtime, missing model, timeout, invalid model response, and unexpected failure.
- Configuration should include server port, Ollama base URL, model name, request timeout, maximum scenario length, and logging level.
- Keep the module boundaries testable without requiring Ollama for most tests.
- Use dependency injection or simple constructor parameters for the analysis service so tests can replace the Ollama adapter with a fake model client.
- Avoid database persistence in the initial PRD. Analysis requests are stateless unless a later requirement adds conversation history.
- Avoid external AI provider integration in the initial PRD.
- Apply the `ready-for-agent` triage label when this PRD is published to the issue tracker.

## Testing Decisions

- Good tests should assert externally visible behavior: API responses, validation outcomes, error contracts, normalized analysis shape, and safety guardrail effects.
- Tests should not assert private implementation details such as exact prompt wording, internal helper call order, or file organization.
- Add unit tests for the scenario intake module covering required fields, optional context normalization, empty input, oversized input, invalid enum values, and sensitive logging boundaries.
- Add unit tests for the prompt builder that verify required scenario facts and safety instructions are represented at a high level without snapshotting the entire prompt.
- Add unit tests for the response normalizer covering valid JSON model output, missing optional fields, invalid enum values, invalid JSON, overly verbose output, and fallback behavior.
- Add unit tests for the safety guardrails module covering money transfer, OTP/password sharing, remote access app installation, identity document sharing, blackmail, and already-compromised account scenarios.
- Add unit tests for the Ollama adapter using a fake HTTP layer or request mocking, covering successful generation, unavailable Ollama, missing model, timeout, and malformed responses.
- Add integration tests for the Express analysis endpoint using the app in memory and a fake analysis service.
- Add integration tests for health endpoints.
- Because the repo currently has no application code or test suite, there is no existing test prior art to follow. Establish a minimal backend test pattern as part of the implementation.
- Do not require a live Ollama model in default automated tests. A separate manual or optional integration check can verify local Ollama behavior.

## Out of Scope

- Frontend UI, mobile app, browser extension, or chat widget.
- User accounts, authentication, and authorization.
- Persistent chat history or database storage.
- Admin dashboard or analytics dashboard.
- Human consultant handoff workflow.
- Direct reporting integrations with banks, police, government agencies, or platforms.
- Automatic URL scanning, malware scanning, phone number reputation lookup, or bank account blacklist lookup.
- External hosted AI provider support.
- Fine-tuning or training a model.
- Legal, financial, or law-enforcement guarantees.
- Real-time voice call analysis.
- Payment recovery automation.

## Further Notes

- The current repository has no Express implementation yet, so this PRD defines the initial backend architecture.
- The backend should be designed for local development and hackathon delivery speed while keeping the AI integration replaceable behind the Ollama adapter.
- The model may produce inconsistent structure, so response normalization and guardrails are important parts of the backend rather than optional polish.
- The assistant should be positioned as a scam-prevention consultant that helps users pause and verify, not as an authority that guarantees whether a scenario is or is not a scam.
