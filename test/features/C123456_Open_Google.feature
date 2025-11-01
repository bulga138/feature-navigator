Feature: Open Google

@C123456
Scenario: Open Google
    Given I open the browser
    When I navigate to "https://www.google.com"
    Then the page title should be "Google"
