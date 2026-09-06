// CLI entrypoint for the AI Failure Analyzer.
//
// Usage (from the ai-quality-analysis/ directory):
//   node analyze.js            # analyze real failures from the latest Karate run
//   node analyze.js --demo     # analyze a bundled fixture (see fixtures/demo-failure.json)
//
// Set OPENAI_API_KEY (and optionally OPENAI_BASE_URL / OPENAI_MODEL) to use a
// real LLM. Without it, a deterministic heuristic fallback is used so the
// pipeline always runs end-to-end without external dependencies.

import fs from 'node:fs';
import path from 'node:path';
import { extractFailures } from './extract-failures.js';
import { classifyFailure } from './classify.js';
import { judgeAnalysis } from './judge.js';

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');
const isDemo = process.argv.includes('--demo');

function loadFailures() {
  if (isDemo) {
    const fixturePath = path.resolve(process.cwd(), 'fixtures', 'demo-failure.json');
    return [JSON.parse(fs.readFileSync(fixturePath, 'utf-8'))];
  }
  return extractFailures();
}

function toMarkdown(results) {
  if (results.length === 0) {
    return '# AI Quality Analysis Report\n\nNo failed scenarios found in the latest Karate run. Nothing to triage.\n';
  }
  const rows = results
    .map(
      (r, i) => `## ${i + 1}. ${r.failure.scenarioName}

- **Classification:** ${r.analysis.classification} (severity: ${r.analysis.severity}, confidence: ${r.analysis.confidence})
- **Summary:** ${r.analysis.summary}
- **Possible cause:** ${r.analysis.possibleCause}
- **Recommended action:** ${r.analysis.recommendedAction}
- **Provider:** ${r.analysis.provider}
- **Judge verdict:** ${r.judgment.verdict} (score: ${r.judgment.score}/100)
${r.judgment.errors.length ? `- **Judge issues:** ${r.judgment.errors.join('; ')}` : ''}
`
    )
    .join('\n');
  return `# AI Quality Analysis Report\n\n${rows}`;
}

async function main() {
  const failures = loadFailures();

  if (failures.length === 0) {
    console.log('No failed scenarios detected — Karate deterministic assertions all passed. Nothing to analyze.');
    console.log('Tip: run with --demo to see a sample AI triage using a fixture failure.');
  }

  const results = [];
  for (const failure of failures) {
    const analysis = await classifyFailure(failure);
    const judgment = judgeAnalysis(failure, analysis);
    results.push({ failure, analysis, judgment });

    console.log(`\nScenario: ${failure.scenarioName}`);
    console.log(`  -> AI classification: ${analysis.classification} / ${analysis.severity} (provider: ${analysis.provider})`);
    console.log(`  -> Judge verdict: ${judgment.verdict} (score ${judgment.score}/100)`);
    if (judgment.errors.length) {
      console.log(`  -> Judge issues: ${judgment.errors.join('; ')}`);
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ai-quality-report.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ai-quality-report.md'), toMarkdown(results));
  console.log(`\nReport written to ${path.join(OUTPUT_DIR, 'ai-quality-report.json')} and .md`);
}

main().catch((err) => {
  console.error('AI Failure Analyzer crashed:', err);
  process.exit(1);
});
