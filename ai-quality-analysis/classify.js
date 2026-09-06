// AI Failure Analyzer — classifies an already-failed Karate scenario.
// IMPORTANT: this module is invoked *after* Karate has determined pass/fail.
// It never changes the test result; it only produces a triage explanation.

const SYSTEM_PROMPT = `You are a Quality Engineering assistant that triages a single FAILED API test case.
You will be given the deterministic evidence Karate collected (expected status, observed status codes,
failing assertion steps, error messages, and a request/response log excerpt).

Respond with ONLY a JSON object (no markdown fences, no prose) with exactly these fields:
{
  "classification": one of ["API_BUG","CONTRACT_SCHEMA_ISSUE","DATA_ISSUE","INFRASTRUCTURE","TEST_DEFECT"],
  "severity": one of ["LOW","MEDIUM","HIGH","CRITICAL"],
  "summary": short one-sentence description of what went wrong,
  "possibleCause": likely root cause,
  "recommendedAction": what a QA/engineer should do next,
  "confidence": number between 0 and 1
}

Rules:
- Only reference status codes, endpoints, or fields that literally appear in the evidence provided.
- Do not invent details that are not present in the evidence.
- If evidence is insufficient, lower "confidence" instead of guessing.`;

function buildUserPrompt(failure) {
  return JSON.stringify(
    {
      scenarioName: failure.scenarioName,
      tags: failure.tags,
      exampleData: failure.exampleData,
      expectedStatus: failure.expectedStatus,
      statusCodesObserved: failure.statusCodesObserved,
      failingSteps: failure.failingSteps,
      errorMessages: failure.errorMessages,
      requestResponseLogExcerpt: failure.requestResponseLog.slice(0, 2000),
    },
    null,
    2
  );
}

async function classifyWithLLM(failure, { apiKey, baseUrl, model }) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(failure) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM provider responded with HTTP ${res.status}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const parsed = JSON.parse(content);
  return { ...parsed, provider: `llm:${model}` };
}

// Deterministic fallback so the demo works with zero external dependencies
// or API keys. This is intentionally simple rule-based logic, NOT a model —
// it exists so the pipeline is always runnable end-to-end.
function classifyHeuristically(failure) {
  const { expectedStatus, statusCodesObserved, errorMessages } = failure;
  const actualStatus = statusCodesObserved.find((c) => c !== expectedStatus) ?? statusCodesObserved[0] ?? null;
  const errorText = errorMessages.join(' ').toLowerCase();

  let classification = 'TEST_DEFECT';
  let severity = 'MEDIUM';
  let possibleCause = 'Unable to determine root cause from available evidence.';

  if (actualStatus && actualStatus >= 500) {
    classification = 'INFRASTRUCTURE';
    severity = 'HIGH';
    possibleCause = `Server responded with ${actualStatus}, indicating a backend/infrastructure failure.`;
  } else if (errorText.includes('match failed') || errorText.includes('does not match') || errorText.includes('type')) {
    classification = 'CONTRACT_SCHEMA_ISSUE';
    severity = 'MEDIUM';
    possibleCause = 'Response payload shape or data types no longer match the expected contract.';
  } else if (actualStatus && expectedStatus && actualStatus !== expectedStatus) {
    classification = 'API_BUG';
    severity = actualStatus === 404 ? 'HIGH' : 'MEDIUM';
    possibleCause = `Expected HTTP ${expectedStatus} but observed ${actualStatus}.`;
  } else if (errorText.includes('timeout') || errorText.includes('connection')) {
    classification = 'INFRASTRUCTURE';
    severity = 'HIGH';
    possibleCause = 'Network/connection issue while calling the API.';
  }

  return {
    classification,
    severity,
    summary: `Scenario "${failure.scenarioName}" failed${actualStatus ? ` (observed status ${actualStatus})` : ''}.`,
    possibleCause,
    recommendedAction: 'Review the request/response log excerpt and reproduce the call manually to confirm the root cause.',
    confidence: 0.5,
    provider: 'heuristic-fallback',
  };
}

export async function classifyFailure(failure) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return classifyHeuristically(failure);
  }

  try {
    return await classifyWithLLM(failure, { apiKey, baseUrl, model });
  } catch (err) {
    return {
      ...classifyHeuristically(failure),
      provider: `heuristic-fallback (llm error: ${err.message})`,
    };
  }
}
