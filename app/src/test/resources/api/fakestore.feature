Feature: Fake Store API - Productos

  Background:
    Given url baseUrl

  @id-1 @caso-de-prueba @positivo
  Scenario Outline: T-API-PQBP-1-CA1 Obtener producto específico - GET /products/{id}
    Given path 'products', <productId>
    When method get
    Then status 200
    And match response.id == <productId>
    And match response.title != null
    And match response.price == '#number'
    And match response.description == '#string'
    And match response.category == '#string'
    And match response.image == '#string'
    And match response.rating == { rate: '#number', count: '#number' }

    Examples:
      | read('data/get_product_by_id.csv') |

  @id-2 @caso-de-prueba @positivo
  Scenario Outline: T-API-PQBP-1-CA2 Listar productos por categoría - GET /products/category/{category}
    Given path 'products', 'category', '<category>'
    When method get
    Then status 200
    # Validate all returned items belong to the requested category and have expected types
    And match each response[*].category == '<category>'
    And match each response[*].price == '#number'
    And match each response[*].id == '#number'

    Examples:
      | read('data/get_products_by_category.csv') |

  @id-3 @caso-de-prueba @positivo
  Scenario Outline: T-API-PQBP-1-CA3 Crear producto exitosamente - POST /products
    Given path 'products'
    And request { title: '<title>', price: <price>, description: '<description>', image: '<image>', category: '<category>' }
    When method post
    Then status 201
    And match response.title == '<title>'
    And match response.category == '<category>'
    And match response.id == '#number'
    # price may be returned as number or string; validate presence and type flexibly
    * eval var pType = typeof response.price
    * assert pType == 'number' || pType == 'string'

    Examples:
      | read('data/create_product.csv') |

  @id-4 @caso-de-prueba @negativo
  Scenario Outline: T-API-PQBP-1-CA4 Producto no encontrado - GET /products/{id}
    Given path 'products', <productId>
    When method get
    Then status 200
    * eval var ok = (response == null) || (typeof response == 'string' && response.trim && response.trim().length == 0) || (typeof response == 'object' && Object.keys(response).length == 0)
    * assert ok

    Examples:
      | read('data/product_not_found.csv') |

  @id-5 @caso-de-prueba @negativo
  Scenario Outline: T-API-PQBP-1-CA5 Categoría inválida - GET /products/category/{category}
    Given path 'products', 'category', '<category>'
    When method get
    Then status 200
    And match response == []

    Examples:
      | read('data/invalid_category.csv') |

  @id-6 @caso-de-prueba @negativo
  Scenario Outline: T-API-PQBP-1-CA6 Validación de límites - GET /products?limit={limitValue}
    Given path 'products'
    And param limit = <limitValue>
    When method get
    Then status 200
    * eval var okLimit = Array.isArray(response) ? response.length <= <limitValue> : false
    * assert okLimit
    And match each response[*].id == '#number'

    Examples:
      | read('data/limit.csv') |
