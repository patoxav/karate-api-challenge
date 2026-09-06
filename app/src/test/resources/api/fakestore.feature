Feature: Fake Store API - Productos

  Background:
    # baseUrl is defined once in karate-config.js and reused via 'url' + 'path'
    Given url baseUrl

  Scenario: Obtener producto específico - GET /products/{id}
    Given path 'products', 1
    When method get
    Then status 200
    And match response.id == 1
    And match response.title != null
    And match response.price == '#number'
    And match response.description == '#string'
    And match response.category == '#string'
    And match response.image == '#string'
    And match response.rating == { rate: '#number', count: '#number' }

  Scenario: Listar productos por categoría - GET /products/category/electronics
    Given path 'products', 'category', 'electronics'
    When method get
    Then status 200
    # Validate all returned items belong to the requested category and have expected types
    And match each response[*].category == 'electronics'
    And match each response[*].price == '#number'
    And match each response[*].id == '#number'

  Scenario: Crear producto exitosamente - POST /products
    Given path 'products'
    And request { title: 'QA Test Product', price: 19.99, description: 'Producto creado por pruebas automatizadas', image: 'https://i.pravatar.cc', category: 'electronics' }
    When method post
    Then status 201
    And match response.title == 'QA Test Product'
    And match response.category == 'electronics'
    And match response.id == '#number'
    # price may be returned as number or string; validate presence and type flexibly
    * eval var pType = typeof response.price
    * assert pType == 'number' || pType == 'string'

  Scenario: Producto no encontrado - GET /products/999999
    Given path 'products', 999999
    When method get
    Then status 200
    * eval var ok = (response == null) || (typeof response == 'string' && response.trim && response.trim().length == 0) || (typeof response == 'object' && Object.keys(response).length == 0)
    * assert ok

  Scenario: Categoría inválida - GET /products/category/categoria-inexistente
    Given path 'products', 'category', 'categoria-inexistente'
    When method get
    Then status 200
    And match response == []

  Scenario: Validación de límites - GET /products?limit=5
    Given path 'products'
    And param limit = 5
    When method get
    Then status 200
    * eval var okLimit = Array.isArray(response) ? response.length <= 5 : false
    * assert okLimit
    And match each response[*].id == '#number'
