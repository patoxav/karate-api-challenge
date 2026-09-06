EVALUATION — Fake Store API automated tests

Resumen:
- Stack: Karate (karate-junit5) + Gradle
- Tests implementados: 6 Scenario Outline (mix positivo/negativo), data-driven vía CSV
  - CA1: GET /products/{id} (positivo) - data/get_product_by_id.csv
  - CA2: GET /products/category/electronics (positivo) - data/get_products_by_category.csv
  - CA3: POST /products (positivo) - data/create_product.csv
  - CA4: GET /products/999999 (negativo) - data/product_not_found.csv
  - CA5: GET /products/category/categoria-inexistente (negativo) - data/invalid_category.csv
  - CA6: GET /products?limit=5 (negativo/edge) - data/limit.csv
- Tags: @id-N (identifica el caso) y @caso-de-prueba en todos, @positivo/@negativo según tipo
- Nomenclatura: cada Scenario Outline usa el identificador T-API-PQBP-1-CA{n}

Ejecución y reportes:
- Ejecutar: from repo root -> cd app && ./gradlew test
- Reportes Karate: app/build/karate-reports/karate-summary.html and per-scenario HTMLs
- Cada fallo incluye request/response in Karate reports (click a scenario)

Hallazgos y consideraciones:
- Fake Store API simula create/update pero la data es efímera.
- Respuesta negativas pueden considerarse 404 dependera de la API y su comportamiento

IA/Agents usadas: GitHub Copilot CLI (agente) para escribir/editar features Karate, script de análisis
semántico con IA y documentación. Ningún MCP externo.

Capa adicional de IA (análisis semántico con LLM real):
- Ubicación: ai-quality-analysis/ (Node.js standalone, no interfiere con Gradle/Karate).
- Principio: el LLM nunca decide pass/fail; Karate ya lo determinó de forma determinística
  (status, schema, tipos, valores). La IA solo añade una revisión semántica adicional y acotada
  sobre un request/response ya capturado.
- Integración real (no simulada): `analyze-response.js` hace una llamada HTTP directa a la API de
  OpenAI (`OPENAI_API_KEY` real, sin fallback heurístico ni mocks) y devuelve un JSON con
  `classification` (EXPECTED_BEHAVIOR | SUSPICIOUS | LIKELY_BUG), `risk` (LOW | MEDIUM | HIGH) y
  `observation`.
- Validación de salida: el script verifica que la respuesta del LLM tenga el schema esperado y use
  solo los valores permitidos antes de mostrarla, sin re-evaluar el resultado del test.
- Validado en vivo con una API key real de OpenAI contra `fixtures/sample-response.json`.

Conclusión:
- Framework estructurado para escalar: tests en resources/api/*.feature y runners en src/test/java/api
- Recomendaciones: add CI step to run ./gradlew :app:test and publish Karate HTML report as artifact; parametrizar baseUrl via karate-config.js for environments.
- Extensión natural: usar analyze-response.js sobre casos puntuales durante triage manual, como
  segunda opinión semántica — nunca como reemplazo de las assertions determinísticas de Karate.