const baseUrl = process.env.JONE_BASE_URL ?? "http://localhost:3000";

const scenario = {
  scenario:
    "Someone claiming to be my bank sent a link and asked for my OTP to stop account suspension.",
  context: {
    channel: "sms",
    requestedAction: "Open a link and share OTP",
    deadlineOrUrgency: "Immediately",
    userConcern: "I am worried my bank account will be locked"
  },
  language: "en"
};

async function main() {
  await checkJson(`${baseUrl}/health`, "process health");
  await checkJson(`${baseUrl}/health/dependencies`, "Ollama dependency health");

  const analysis = await postJson(
    `${baseUrl}/api/v1/scam/analyze`,
    scenario,
    "scam analysis"
  );

  assertAnalysisShape(analysis);
  console.log("Ollama smoke check passed");
}

async function checkJson(url, label) {
  const response = await fetch(url);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`${label} failed: ${JSON.stringify(body)}`);
  }

  console.log(`${label}: ${JSON.stringify(body)}`);
  return body;
}

async function postJson(url, body, label) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(`${label} failed: ${JSON.stringify(responseBody)}`);
  }

  console.log(`${label}: ${JSON.stringify(responseBody)}`);
  return responseBody;
}

function assertAnalysisShape(value) {
  const requiredFields = [
    "isScam",
    "riskLevel",
    "confidence",
    "category",
    "explanation"
  ];

  for (const field of requiredFields) {
    if (!(field in value)) {
      throw new Error(`analysis response missing ${field}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
