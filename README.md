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

## Capa opcional: AI Failure Analyzer

Módulo independiente en `ai-quality-analysis/` (Node.js, sin dependencias externas) que se ejecuta
**después** de Karate, solo para dar triage/explicación a escenarios que ya fallaron. El LLM nunca
decide si un test pasa o falla — eso lo sigue determinando exclusivamente Karate (status, schema,
tipos, valores).

```
Fake Store API
      │
      ▼
   Karate ── assertions determinísticas (status / schema / tipos / valores)
      │
      ▼
Karate Report (JSON)
      │
      ▼
AI Failure Analyzer ── clasifica: API_BUG | CONTRACT_SCHEMA_ISSUE | DATA_ISSUE | INFRASTRUCTURE | TEST_DEFECT
      │
      ▼
Judge (determinístico) ── valida schema, grounding en evidencia, severidad y accionabilidad de la respuesta del LLM
```

Uso:

```
cd app && ./gradlew test          # genera app/build/karate-reports/*.karate-json.txt
cd ../ai-quality-analysis
node analyze.js                    # analiza fallos reales del último run (heurística si no hay API key)
node analyze.js --demo              # analiza un fixture de ejemplo para ver el flujo sin necesitar un fallo real
```

Con `OPENAI_API_KEY` definido (y opcionalmente `OPENAI_BASE_URL` / `OPENAI_MODEL`) usa un LLM real;
sin la key, cae a un clasificador heurístico determinístico para que el pipeline siempre corra end-to-end.
Salida: `ai-quality-analysis/output/ai-quality-report.{json,md}` (ignorado por git, se regenera en cada corrida).
