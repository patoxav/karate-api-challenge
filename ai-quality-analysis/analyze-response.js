// Integración real y acotada de IA: envía UN request/response capturado por
// Karate a un LLM real y recibe una evaluación semántica estructurada.
// No decide pass/fail — Karate ya lo hizo. Esto es una capa adicional
// experimental de análisis semántico.
//
// Uso:
//   OPENAI_API_KEY=sk-... node analyze-response.js fixtures/sample-response.json

import fs from 'node:fs';

const ALLOWED_CLASSIFICATIONS = ['EXPECTED_BEHAVIOR', 'SUSPICIOUS', 'LIKELY_BUG'];
const ALLOWED_RISKS = ['LOW', 'MEDIUM', 'HIGH'];

const SYSTEM_PROMPT = `You are a QA assistant doing a semantic review of a single API request/response pair.
Karate already validated status/schema/types deterministically. Your job is NOT to say pass/fail —
only to flag anything semantically unusual.

Respond with ONLY a JSON object with exactly these fields:
{
  "classification": one of ["EXPECTED_BEHAVIOR","SUSPICIOUS","LIKELY_BUG"],
  "risk": one of ["LOW","MEDIUM","HIGH"],
  "observation": one short sentence, referencing only values present in the input
}

Rules:
- Only reference values that literally appear in the input JSON.
- Never invent fields, endpoints, or numbers not present in the input.`;

function validateOutput(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') return { valid: false, errors: ['not an object'] };
  if (!ALLOWED_CLASSIFICATIONS.includes(obj.classification)) errors.push(`invalid classification: ${obj.classification}`);
  if (!ALLOWED_RISKS.includes(obj.risk)) errors.push(`invalid risk: ${obj.risk}`);
  if (typeof obj.observation !== 'string' || obj.observation.length < 5) errors.push('observation missing/too short');
  return { valid: errors.length === 0, errors };
}

async function main() {
  const inputPath = process.argv[2] || 'fixtures/sample-response.json';
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    console.error('Falta OPENAI_API_KEY. Este script hace una llamada REAL a un LLM.');
    console.error('Ejemplo: OPENAI_API_KEY=sk-... node analyze-response.js fixtures/sample-response.json');
    process.exit(1);
  }

  const input = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log('--- Input capturado por Karate ---');
  console.log(JSON.stringify(input, null, 2));

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`LLM call failed: HTTP ${res.status} ${await res.text()}`);

  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
  const validation = validateOutput(parsed);

  console.log('\n--- Salida real del LLM ---');
  console.log(JSON.stringify(parsed, null, 2));
  console.log('\n--- Validación de la salida (schema + valores permitidos) ---');
  console.log(validation.valid ? 'VÁLIDA ✅' : `INVÁLIDA ❌ (${validation.errors.join('; ')})`);
}

main().catch((err) => {
  console.error('analyze-response crashed:', err.message);
  process.exit(1);
});