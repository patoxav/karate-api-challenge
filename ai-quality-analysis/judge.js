// LLM-as-Judge (deterministic) — evaluates the AI Failure Analyzer's own output.
// This never touches the Karate test verdict; it only scores whether the
// AI-generated triage is well-formed, grounded in evidence, and useful.

import { isValidShape } from './schema.js';

function extractStatusMentions(text) {
  const matches = text.match(/\b[1-5]\d{2}\b/g) || [];
  return [...new Set(matches.map(Number))];
}

export function judgeAnalysis(failure, analysis) {
  const checks = {};

  const shape = isValidShape(analysis);
  checks.validSchema = shape.valid;
  const errors = [...shape.errors];

  // Grounding check: any HTTP status number the analysis talks about must be
  // one that was actually observed/expected in the evidence — never invented.
  const evidenceStatuses = new Set([
    ...(failure.statusCodesObserved || []),
    ...(failure.expectedStatus != null ? [failure.expectedStatus] : []),
  ]);
  const mentionedInAnalysis = extractStatusMentions(
    `${analysis.summary ?? ''} ${analysis.possibleCause ?? ''} ${analysis.recommendedAction ?? ''}`
  );
  const hallucinatedStatuses = mentionedInAnalysis.filter((c) => !evidenceStatuses.has(c));
  checks.groundedInEvidence = hallucinatedStatuses.length === 0;
  if (!checks.groundedInEvidence) {
    errors.push(`mentions status code(s) not present in evidence: ${hallucinatedStatuses.join(', ')}`);
  }

  // Usefulness heuristic: recommendation must be a real sentence, not empty/boilerplate-only.
  const recommendation = (analysis.recommendedAction || '').trim();
  checks.actionable = recommendation.length >= 15;
  if (!checks.actionable) {
    errors.push('recommendedAction is missing or too short to be actionable');
  }

  // Confidence sanity: don't allow high confidence with no supporting evidence at all.
  const hasEvidence = (failure.statusCodesObserved || []).length > 0 || (failure.errorMessages || []).length > 0;
  checks.confidenceSane = !(analysis.confidence > 0.85 && !hasEvidence);
  if (!checks.confidenceSane) {
    errors.push('confidence is high despite little/no supporting evidence');
  }

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    verdict: errors.length === 0 ? 'PASS' : 'FAIL',
    score,
    checks,
    errors,
  };
}
