Feature: Fake Store API - Productos

  Background:
    # baseUrl is defined once in karate-config.js and reused via 'url' + 'path'
    Given url baseUrl

  @id-1 @caso-de-prueba @positivo
  Scenario Outline: T-API-PQBP-1-CA1 Obtener producto específico - GET /products/{id}

    Given path 'products', <productId>
    When method get

    Then status 200

    # Validación de datos esperados
    And match response.id == <productId>
    And match response.title contains '<responseTitle>'
    And match response.category == "<responseCategory>"
    And match response.description contains '<responseDescriptionWord>'

    # Validación de tipos
    And match response.id == '#number'
    And match response.title == '#string'
    And match response.price == '#number'
    And match response.description == '#string'
    And match response.category == '#string'
    And match response.image == '#string'

    # Validación de estructura de rating
    And match response.rating == { rate: '#number', count: '#number' }

    # Validaciones adicionales de negocio
    And assert response.price > 0
    And assert response.rating.rate >= 0 && response.rating.rate <= 5
    And assert response.rating.count >= 0

    Examples:
      | read('data/get_product_by_id.csv') |

  @id-2 @caso-de-prueba @positivo
  Scenario Outline: T-API-PQBP-1-CA2 Listar productos por categoría - GET /products/category/{category}

    Given path 'products', 'category', "<category>"
    When method get

    Then status 200

    # Validar que la respuesta sea un array no vacío
    And match response == '#[]'
    And assert response.length > 0

    # Todos los productos deben pertenecer a la categoría solicitada
    And match each response[*].category == "<category>"

    # Validar estructura y tipos de cada producto
    And match each response[*] contains
    """
    {
      id: '#number',
      title: '#string',
      price: '#number',
      description: '#string',
      category: '#string',
      image: '#string',
      rating: {
        rate: '#number',
        count: '#number'
      }
    }
    """

    # Validaciones adicionales
    And match each response[*].price == '#? _ > 0'
    And match each response[*].rating.rate == '#? _ >= 0 && _ <= 5'
    And match each response[*].rating.count == '#? _ >= 0'

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
    And match response.description == '<description>'
    And match response.image == '<image>'
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

  @id-6 @caso-de-prueba @negativo @edge-case
  Scenario Outline: T-API-PQBP-1-CA6 Validación de límites - GET /products?limit={limitValue}

    Given path 'products'
    And param limit = <limitValue>
    When method get

    Then status 200

    # Validar que la respuesta sea una lista
    And match response == '#[]'

    # Validar que el límite solicitado se respete
    And assert response.length <= <limitValue>

    # Para un límite positivo, esperamos al menos un resultado
    And assert response.length > 0

    # Validar estructura mínima de los productos retornados
    And match each response[*].id == '#number'
    And match each response[*].title == '#string'
    And match each response[*].price == '#number'

    Examples:
      | read('data/limit.csv') |
