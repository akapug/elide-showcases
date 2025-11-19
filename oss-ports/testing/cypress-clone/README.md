# Cypress Clone - JavaScript E2E Testing for Elide

Fast, easy and reliable testing for anything that runs in a browser, ported to Elide.

## Features

- **⚡ Real-time Reloads**: Instantly see updates as you develop
- **🎯 Time Travel**: Debug by traveling back to each command
- **🔍 Network Stubs**: Easily control and test edge cases
- **📸 Screenshots & Videos**: Automatically capture on failure
- **🎨 Command Log**: Visual feedback for every action
- **🌐 Cross-browser**: Run tests across multiple browsers
- **🔧 Auto-waiting**: Never add waits or sleeps to tests
- **🎭 Flake Resistant**: Reliable, repeatable test results
- **TypeScript**: First-class TypeScript support

## Installation

```bash
elide install @elide/cypress-clone
```

## Quick Start

```typescript
describe('My First Test', () => {
  it('Visits the app', () => {
    cy.visit('https://example.com');
    cy.contains('type').click();
    cy.url().should('include', '/commands/actions');
    cy.get('.action-email')
      .type('fake@email.com')
      .should('have.value', 'fake@email.com');
  });
});
```

## Running Tests

```bash
# Open Cypress Test Runner
elide cypress open

# Run headlessly
elide cypress run

# Run specific spec
elide cypress run --spec "cypress/e2e/login.cy.ts"

# Run in specific browser
elide cypress run --browser chrome
```

## Core Concepts

### Commands

Cypress commands are chainable and automatically retry:

```typescript
cy.visit('https://example.com')
  .get('input[name="email"]')
  .type('user@example.com')
  .should('have.value', 'user@example.com');
```

### Querying

```typescript
// By CSS selector
cy.get('#main');
cy.get('.list > li');

// By text content
cy.contains('Submit');
cy.contains('button', 'Submit');

// Traversal
cy.get('ul').find('li');
cy.get('li').first();
cy.get('li').last();
cy.get('li').eq(2);
cy.get('.selected').parent();
cy.get('.parent').children();
cy.get('.item').siblings();

// Filtering
cy.get('li').filter('.active');
cy.get('li').not('.disabled');
```

### Actions

```typescript
// Click
cy.get('button').click();
cy.get('button').dblclick();
cy.get('button').rightclick();

// Type
cy.get('input').type('Hello World');
cy.get('input').clear();
cy.get('input').type('{enter}');
cy.get('input').type('{ctrl}A');

// Select
cy.get('select').select('value');
cy.get('select').select(['option1', 'option2']);

// Check/Uncheck
cy.get('[type="checkbox"]').check();
cy.get('[type="checkbox"]').uncheck();
cy.get('[type="radio"]').check('value');

// Focus
cy.get('input').focus();
cy.get('input').blur();

// Scroll
cy.scrollTo('bottom');
cy.scrollTo(0, 500);
cy.get('#element').scrollIntoView();

// Trigger
cy.get('button').trigger('mouseover');
```

### Assertions

```typescript
// Length
cy.get('li').should('have.length', 3);

// Value
cy.get('input').should('have.value', 'test');

// Text
cy.get('h1').should('contain', 'Welcome');
cy.get('h1').should('have.text', 'Welcome');

// Visibility
cy.get('.modal').should('be.visible');
cy.get('.modal').should('not.be.visible');

// Existence
cy.get('.error').should('exist');
cy.get('.error').should('not.exist');

// Disabled/Enabled
cy.get('button').should('be.disabled');
cy.get('button').should('be.enabled');

// Checked
cy.get('[type="checkbox"]').should('be.checked');
cy.get('[type="checkbox"]').should('not.be.checked');

// Class
cy.get('button').should('have.class', 'active');

// Attribute
cy.get('a').should('have.attr', 'href', '/about');

// CSS
cy.get('button').should('have.css', 'color', 'rgb(255, 0, 0)');

// URL
cy.url().should('include', '/dashboard');
cy.url().should('eq', 'https://example.com/dashboard');
cy.location('pathname').should('eq', '/dashboard');

// Chaining
cy.get('input')
  .should('be.visible')
  .and('be.enabled')
  .and('have.value', 'test');
```

### Network Requests

```typescript
// Intercept requests
cy.intercept('GET', '/api/users', { fixture: 'users.json' });

cy.intercept('POST', '/api/users', (req) => {
  req.reply({
    statusCode: 201,
    body: { id: 123, name: 'New User' }
  });
});

// Wait for request
cy.intercept('GET', '/api/users').as('getUsers');
cy.visit('/users');
cy.wait('@getUsers').its('response.statusCode').should('eq', 200);

// Modify requests
cy.intercept('POST', '/api/data', (req) => {
  req.body.modified = true;
  req.continue();
});

// Network delays
cy.intercept('GET', '/api/slow', (req) => {
  req.reply({ delay: 1000, statusCode: 200, body: {} });
});
```

### Fixtures

```typescript
// Load fixture
cy.fixture('users.json').then((users) => {
  cy.intercept('GET', '/api/users', users);
});

// Use in intercept
cy.intercept('GET', '/api/users', { fixture: 'users.json' });

// With alias
cy.fixture('users.json').as('users');
cy.get('@users').then((users) => {
  // Use fixture data
});
```

### Aliases

```typescript
// Create alias
cy.get('.btn').as('myButton');

// Use alias
cy.get('@myButton').click();

// Request alias
cy.intercept('GET', '/api/users').as('getUsers');
cy.wait('@getUsers');

// Fixture alias
cy.fixture('users.json').as('users');
cy.get('@users').then((users) => {
  expect(users).to.have.length(3);
});
```

### Custom Commands

```typescript
// Define custom command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Use custom command
cy.login('user@example.com', 'password123');

// With TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}
```

### Cookies & Local Storage

```typescript
// Cookies
cy.getCookie('session_id');
cy.getCookies();
cy.setCookie('session_id', 'abc123');
cy.clearCookie('session_id');
cy.clearCookies();

// Local Storage
cy.clearLocalStorage();
cy.clearLocalStorage('key');

// Window
cy.window().then((win) => {
  win.localStorage.setItem('key', 'value');
});
```

### Viewport

```typescript
// Set viewport
cy.viewport(1280, 720);
cy.viewport('iphone-6');
cy.viewport('ipad-2', 'landscape');

// Responsive testing
cy.viewport(320, 568); // iPhone SE
cy.get('.mobile-menu').should('be.visible');

cy.viewport(1920, 1080); // Desktop
cy.get('.mobile-menu').should('not.be.visible');
```

### Screenshots & Videos

```typescript
// Take screenshot
cy.screenshot();
cy.screenshot('my-screenshot');
cy.get('.hero').screenshot();

// Automatic screenshots on failure
Cypress.Screenshot.defaults({
  screenshotOnRunFailure: true
});

// Video recording (automatic in cypress run)
```

### Configuration

```typescript
// cypress.config.ts
import { defineConfig } from '@elide/cypress-clone';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 4000,
    requestTimeout: 5000,
    responseTimeout: 30000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    }
  }
});
```

### Environment Variables

```typescript
// Access in tests
const apiUrl = Cypress.env('API_URL');
cy.visit(apiUrl);

// Set in config
export default defineConfig({
  env: {
    API_URL: 'https://api.example.com'
  }
});

// Set via CLI
elide cypress run --env API_URL=https://staging.api.example.com
```

### Page Objects

```typescript
class LoginPage {
  visit() {
    cy.visit('/login');
  }

  fillEmail(email: string) {
    cy.get('input[name="email"]').type(email);
    return this;
  }

  fillPassword(password: string) {
    cy.get('input[name="password"]').type(password);
    return this;
  }

  submit() {
    cy.get('button[type="submit"]').click();
  }
}

const loginPage = new LoginPage();

it('logs in', () => {
  loginPage
    .visit()
    .fillEmail('user@example.com')
    .fillPassword('password123')
    .submit();

  cy.url().should('include', '/dashboard');
});
```

### Hooks

```typescript
describe('Test Suite', () => {
  before(() => {
    // Runs once before all tests
    cy.task('seedDatabase');
  });

  beforeEach(() => {
    // Runs before each test
    cy.login('user@example.com', 'password');
  });

  afterEach(() => {
    // Runs after each test
    cy.clearCookies();
  });

  after(() => {
    // Runs once after all tests
    cy.task('clearDatabase');
  });

  it('test 1', () => {
    // Test code
  });

  it('test 2', () => {
    // Test code
  });
});
```

### Debugging

```typescript
// Debug command
cy.get('button').debug();

// Pause execution
cy.pause();

// Log values
cy.get('input').then($input => {
  console.log($input.val());
});

// Screenshot for debugging
cy.screenshot('debug-state');
```

## Best Practices

1. **Use data-* attributes for selectors**
   ```typescript
   cy.get('[data-testid="submit-button"]').click();
   ```

2. **Don't use arbitrary waits**
   ```typescript
   // Bad
   cy.wait(1000);

   // Good
   cy.get('.loading').should('not.exist');
   ```

3. **Use aliases for cleaner code**
   ```typescript
   cy.get('.user-list li').as('users');
   cy.get('@users').should('have.length', 5);
   cy.get('@users').first().click();
   ```

4. **Keep tests isolated**
   ```typescript
   beforeEach(() => {
     cy.visit('/');
     cy.clearCookies();
   });
   ```

## Performance

```
Test Execution:
  Simple test: ~2s
  Complex flow: ~8s
  With network stubs: ~1s

Video Recording:
  Impact: +15-20% execution time

Screenshots:
  Per screenshot: ~50ms
```

## Architecture

```
cypress-clone/
├── src/
│   ├── commands/       # Built-in and custom commands
│   ├── runner/         # Test runner
│   ├── server/         # Proxy server for network
│   └── reporter/       # Test reporters
├── examples/           # Usage examples
└── cypress/
    ├── e2e/            # E2E tests
    ├── fixtures/       # Test data
    └── support/        # Support files
```

## License

MIT
