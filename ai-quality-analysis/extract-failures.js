// Reads Karate's per-feature JSON reports (build/karate-reports/*.karate-json.txt)
// and extracts a normalized "failure record" for every scenario whose
// deterministic assertions (status/schema/match) did NOT pass.
//
// This module never re-evaluates pass/fail — it only reads what Karate
// already decided, so the AI layer downstream cannot influence test results.

import fs from 'node:fs';
import path from 'node:path';

const REPORTS_DIR = path.resolve(process.cwd(), '..', 'app', 'build', 'karate-reports');

function findFeatureReports(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.karate-json.txt'))
    .map((f) => path.join(dir, f));
}

// Only trust status codes from Karate's own "N < 200" response-line format —
// scanning the whole raw log with a generic 3-digit regex would also match
// timestamps, prices, ports, etc. and produce false evidence.
function extractStatusCodes(requestResponseLog) {
  if (!requestResponseLog) return [];
  const matches = [...requestResponseLog.matchAll(/^\d+\s*<\s*([1-5]\d{2})\b/gm)];
  return [...new Set(matches.map((m) => Number(m[1])))];
}

function buildRequestResponseSummary(scenarioResult) {
  const logs = (scenarioResult.stepResults || [])
    .map((sr) => sr.stepLog)
    .filter(Boolean)
    .join('\n---\n');
  return logs.slice(0, 4000); // cap size sent to the LLM / stored in report
}

function extractFailureFromScenario(scenarioResult, feature) {
  if (!scenarioResult.failed) return null;

  const failingSteps = (scenarioResult.stepResults || []).filter(
    (sr) => sr.result && sr.result.status === 'failed'
  );
  const errorMessages = failingSteps
    .map((sr) => sr.result.errorMessage || sr.result.error || sr.result.message)
    .filter(Boolean);
  const failingStepTexts = failingSteps.map((sr) => sr.step && sr.step.text).filter(Boolean);

  const requestResponseLog = buildRequestResponseSummary(scenarioResult);
  const statusCodesSeen = extractStatusCodes(requestResponseLog);

  // The last "status <code>" style assertion in the feature tells us what was expected.
  const expectedStatusStep = (scenarioResult.stepResults || [])
    .map((sr) => sr.step && sr.step.text)
    .find((t) => t && /^status \d+/.test(t));
  const expectedStatus = expectedStatusStep ? Number(expectedStatusStep.match(/\d+/)[0]) : null;

  return {
    featureFile: feature.relativePath,
    scenarioName: scenarioResult.name,
    tags: scenarioResult.tags || [],
    exampleData: scenarioResult.exampleData || {},
    expectedStatus,
    statusCodesObserved: statusCodesSeen,
    failingSteps: failingStepTexts,
    errorMessages,
    requestResponseLog,
  };
}

export function extractFailures() {
  const reportFiles = findFeatureReports(REPORTS_DIR);
  const failures = [];
  for (const file of reportFiles) {
    const feature = JSON.parse(fs.readFileSync(file, 'utf-8'));
    for (const scenarioResult of feature.scenarioResults || []) {
      const failure = extractFailureFromScenario(scenarioResult, feature);
      if (failure) failures.push(failure);
    }
  }
  return failures;
}
