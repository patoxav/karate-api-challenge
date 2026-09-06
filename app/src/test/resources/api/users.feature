Feature: Users API

  Scenario: Obtener usuarios
    Given url 'https://reqres.in/api/users?page=2'
    When method get
    Then status 200