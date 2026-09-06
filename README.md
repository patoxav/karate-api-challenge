# karate-api-challenge
Arquetipo base para automatización de APIs con Karate Framework

Quickstart - ejecutar tests de Fake Store API

1. Ir al módulo app:

   cd app

2. Ejecutar tests (Gradle wrapper incluido):

   ./gradlew test

3. Reportes HTML generados en:

   build/karate-reports/karate-summary.html

Notas:
- Repositorio usa Karate (karate-junit5). Las features se encuentran en src/test/resources/api/.
- Agregar CI para publicar carpetas de build/karate-reports como artefactos para evidencias.

## Capa opcional: análisis semántico con IA (LLM real)

Script pequeño e independiente en `ai-quality-analysis/` que **no forma parte del build de Gradle/Karate**.
Toma un request/response ya capturado (por ejemplo, uno validado por Karate) y lo envía a un LLM real
para una revisión semántica adicional. El LLM **nunca decide pass/fail** — eso lo sigue determinando
exclusivamente Karate (status, schema, tipos, valores).

```
Karate ejecuta
   │  (assertions determinísticas: status / schema / tipos / valores)
   ▼
request/response capturado
   │
   ▼
analyze-response.js (script pequeño)
   │
   ▼
LLM real (OpenAI)
   │
   ▼
JSON: classification (EXPECTED_BEHAVIOR | SUSPICIOUS | LIKELY_BUG) / risk (LOW | MEDIUM | HIGH) / observation
```

Uso:

```
cd ai-quality-analysis
export OPENAI_API_KEY=sk-...
node analyze-response.js fixtures/sample-response.json
```

El script valida que la salida del LLM tenga el schema esperado y solo use valores permitidos
(`classification`/`risk`), pero es intencionalmente pequeño y acotado — no reemplaza ninguna
assertion, solo añade una capa experimental de análisis semántico sobre un caso ya evaluado.
