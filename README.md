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