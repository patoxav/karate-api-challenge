EVALUATION — Fake Store API automated tests

Resumen:
- Stack: Karate (karate-junit5) + Gradle
- Tests implemented: 6 scenarios (mix of positive & negative)
  - GET /products/{id} (positive)
  - GET /products/category/electronics (positive)
  - POST /products (positive)
  - GET /products/999999 (negative)
  - GET /products/category/categoria-inexistente (negative)
  - GET /products?limit=5 (negative/edge)

Ejecución y reportes:
- Ejecutar: from repo root -> cd app && ./gradlew test
- Reportes Karate: app/build/karate-reports/karate-summary.html and per-scenario HTMLs
- Cada fallo incluye request/response in Karate reports (click a scenario)

Hallazgos y consideraciones:
- Fake Store API simula create/update but data is ephemeral.
- Negative responses may be 404 or empty arrays/objects depending on API behavior; tests assert flexibly to accept either.

IA/Agents usadas: none

Conclusión:
- Framework estructurado para escalar: tests en resources/api/*.feature y runners en src/test/java/api
- Recomendaciones: add CI step to run ./gradlew :app:test and publish Karate HTML report as artifact; parametrizar baseUrl via karate-config.js for environments.