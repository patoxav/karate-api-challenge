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
- Fake Store API simula create/update but data is ephemeral.
- Negative responses may be 404 or empty arrays/objects depending on API behavior; tests assert flexibly to accept either.

IA/Agents usadas: none

Conclusión:
- Framework estructurado para escalar: tests en resources/api/*.feature y runners en src/test/java/api
- Recomendaciones: add CI step to run ./gradlew :app:test and publish Karate HTML report as artifact; parametrizar baseUrl via karate-config.js for environments.