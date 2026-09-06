// Contract for the AI Failure Analyzer output.
// The LLM NEVER decides pass/fail — Karate's deterministic assertions already
// did that. This schema only governs the *triage/explanation* payload that
// gets attached to an already-failed scenario.

export const ALLOWED_CLASSIFICATIONS = [
  'API_BUG',            // the API under test behaved incorrectly
  'CONTRACT_SCHEMA_ISSUE', // response shape/types don't match the agreed contract
  'DATA_ISSUE',         // failure caused by test data / fixture state
  'INFRASTRUCTURE',     // network, timeout, 5xx, DNS, TLS, rate limiting, etc.
  'TEST_DEFECT',        // the test itself is wrong (bad assertion, stale locator, etc.)
];

export const ALLOWED_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Required keys and their expected JS typeof value.
export const REQUIRED_FIELDS = {
  classification: 'string',
  severity: 'string',
  summary: 'string',
  possibleCause: 'string',
  recommendedAction: 'string',
  confidence: 'number',
};

export function isValidShape(analysis) {
  const errors = [];
  if (analysis == null || typeof analysis !== 'object') {
    return { valid: false, errors: ['analysis is not an object'] };
  }
  for (const [field, type] of Object.entries(REQUIRED_FIELDS)) {
    if (!(field in analysis)) {
      errors.push(`missing required field: ${field}`);
      continue;
    }
    if (typeof analysis[field] !== type) {
      errors.push(`field "${field}" expected type ${type} but got ${typeof analysis[field]}`);
    }
  }
  if (typeof analysis.classification === 'string' && !ALLOWED_CLASSIFICATIONS.includes(analysis.classification)) {
    errors.push(`classification "${analysis.classification}" is not one of: ${ALLOWED_CLASSIFICATIONS.join(', ')}`);
  }
  if (typeof analysis.severity === 'string' && !ALLOWED_SEVERITIES.includes(analysis.severity)) {
    errors.push(`severity "${analysis.severity}" is not one of: ${ALLOWED_SEVERITIES.join(', ')}`);
  }
  if (typeof analysis.confidence === 'number' && (analysis.confidence < 0 || analysis.confidence > 1)) {
    errors.push('confidence must be between 0 and 1');
  }
  return { valid: errors.length === 0, errors };
}
