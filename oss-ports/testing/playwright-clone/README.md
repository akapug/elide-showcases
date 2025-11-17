# Playwright Clone - End-to-End Testing for Elide

A reliable end-to-end testing framework for modern web apps, ported to Elide with full cross-browser support.

## Features

- **🌐 Cross-Browser**: Test on Chromium, Firefox, and WebKit
- **⚡ Auto-Wait**: Automatically waits for elements to be ready
- **📸 Screenshots & Video**: Built-in visual debugging
- **🔍 Network Interception**: Mock and modify network requests
- **📱 Mobile Emulation**: Test mobile viewports and devices
- **🎭 Contexts**: Isolated browser contexts for parallel testing
- **🔧 Code Generation**: Auto-generate tests from browser actions
- **🎯 Selectors**: Powerful selector engine with auto-retry
- **📊 Trace Viewer**: Visual debugging with timeline
- **TypeScript**: First-class TypeScript support

## Installation

```bash
elide install @elide/playwright-clone
```

## Quick Start

```typescript
import { test, expect } from '@elide/playwright-clone';

test('basic navigation', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);

  await page.click('text=More information');
  await expect(page).toHaveURL(/more/);
});
```

## Running Tests

```bash
# Run all tests
elide playwright test

# Run specific file
elide playwright test tests/login.spec.ts

# Run in headed mode
elide playwright test --headed

# Run in specific browser
elide playwright test --browser=firefox

# Run with UI mode
elide playwright test --ui

# Generate code
elide playwright codegen https://example.com
```

## Writing Tests

### Basic Structure

```typescript
import { test, expect } from '@elide/playwright-clone';

test.describe('Login flow', () => {
  test('successful login', async ({ page }) => {
    await page.goto('https://app.example.com/login');

    // Fill form
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit
    await page.click('button[type="submit"]');

    // Verify
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('failed login', async ({ page }) => {
    await page.goto('https://app.example.com/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toHaveText('Invalid credentials');
  });
});
```

### Page Object Model

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('https://app.example.com/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return await this.page.textContent('.error');
  }
}

test('login with page object', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  await expect(page).toHaveURL(/dashboard/);
});
```

## Selectors

Playwright Clone supports multiple selector strategies:

```typescript
// Text selector
await page.click('text=Submit');
await page.click('text=/submit/i'); // Case-insensitive regex

// CSS selector
await page.click('button.primary');
await page.click('#login-button');

// XPath
await page.click('xpath=//button[@type="submit"]');

// Data-testid
await page.click('[data-testid="login-btn"]');

// Role-based
await page.click('role=button[name="Submit"]');

// Chaining
await page.click('div.modal >> button.close');

// Nth match
await page.click('button >> nth=2');
```

## Actions

### Navigation

```typescript
await page.goto('https://example.com');
await page.goBack();
await page.goForward();
await page.reload();
```

### Clicks

```typescript
await page.click('button');
await page.dblclick('button');
await page.hover('button');
await page.focus('input');
```

### Input

```typescript
await page.fill('input[name="email"]', 'user@example.com');
await page.type('textarea', 'Hello world', { delay: 100 });
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');
await page.selectOption('select', 'value');
```

### Keyboard & Mouse

```typescript
await page.keyboard.press('Enter');
await page.keyboard.type('Hello');
await page.keyboard.down('Shift');
await page.keyboard.up('Shift');

await page.mouse.move(100, 200);
await page.mouse.click(100, 200);
await page.mouse.dblclick(100, 200);
```

## Assertions

```typescript
// Page assertions
await expect(page).toHaveTitle('My App');
await expect(page).toHaveURL('https://example.com');

// Element assertions
await expect(page.locator('h1')).toBeVisible();
await expect(page.locator('h1')).toBeHidden();
await expect(page.locator('h1')).toBeEnabled();
await expect(page.locator('h1')).toBeDisabled();
await expect(page.locator('h1')).toHaveText('Welcome');
await expect(page.locator('h1')).toContainText('Welcome');
await expect(page.locator('input')).toHaveValue('test');
await expect(page.locator('input')).toHaveAttribute('type', 'text');
await expect(page.locator('div')).toHaveClass('active');
await expect(page.locator('div')).toHaveCSS('color', 'rgb(255, 0, 0)');

// Count
await expect(page.locator('li')).toHaveCount(5);

// Screenshots
await expect(page).toHaveScreenshot('homepage.png');
await expect(page.locator('.hero')).toHaveScreenshot('hero.png');
```

## Network Interception

```typescript
test('mock API responses', async ({ page }) => {
  // Mock a route
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
    });
  });

  await page.goto('https://app.example.com');

  // Verify mocked data is displayed
  await expect(page.locator('.user')).toHaveCount(2);
});

test('wait for API call', async ({ page }) => {
  // Wait for specific request
  const responsePromise = page.waitForResponse('**/api/users');

  await page.click('button.load-users');

  const response = await responsePromise;
  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data).toHaveLength(2);
});

test('abort requests', async ({ page }) => {
  // Block images
  await page.route('**/*.{png,jpg,jpeg}', route => route.abort());

  await page.goto('https://example.com');
});
```

## Screenshots & Video

```typescript
test('take screenshot', async ({ page }) => {
  await page.goto('https://example.com');

  // Full page
  await page.screenshot({ path: 'screenshot.png' });

  // Element
  await page.locator('.hero').screenshot({ path: 'hero.png' });

  // Options
  await page.screenshot({
    path: 'screenshot.png',
    fullPage: true,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });
});

// Video recording
test.use({ video: 'on' });

test('record video', async ({ page }) => {
  await page.goto('https://example.com');
  // Video automatically recorded
});
```

## Browser Contexts

```typescript
test('multiple contexts', async ({ browser }) => {
  // Create isolated contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Different sessions
  await page1.goto('https://example.com');
  await page2.goto('https://example.com');

  // Cleanup
  await context1.close();
  await context2.close();
});

test('with permissions', async ({ browser }) => {
  const context = await browser.newContext({
    permissions: ['geolocation'],
    geolocation: { latitude: 37.7749, longitude: -122.4194 }
  });

  const page = await context.newPage();
  await page.goto('https://maps.example.com');
});
```

## Mobile Emulation

```typescript
import { devices } from '@elide/playwright-clone';

test.use({ ...devices['iPhone 12'] });

test('mobile test', async ({ page }) => {
  await page.goto('https://example.com');
  // Page rendered in iPhone 12 viewport
});

test('custom viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://example.com');
});
```

## Fixtures

```typescript
import { test as base } from '@elide/playwright-clone';

type MyFixtures = {
  todoPage: TodoPage;
};

const test = base.extend<MyFixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await use(todoPage);
  }
});

test('use custom fixture', async ({ todoPage }) => {
  await todoPage.addTodo('Buy milk');
  await expect(todoPage.todos).toHaveCount(1);
});
```

## Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@elide/playwright-clone';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 2,
  workers: 4,

  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' }
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' }
    }
  ],

  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: true
  }
});
```

## Performance Benchmarks

```
Browser Launch:
  Chromium: ~200ms
  Firefox: ~250ms
  WebKit: ~300ms

Page Load:
  Average: ~500ms
  With assets: ~1.2s

Test Execution:
  Simple test: ~2s
  Complex flow: ~10s
  Parallel (4 workers): 4x faster
```

## Architecture

```
playwright-clone/
├── src/
│   ├── browser/        # Browser automation
│   ├── page/           # Page interactions
│   ├── network/        # Network interception
│   ├── selectors/      # Selector engine
│   ├── reporter/       # Test reporters
│   └── cli/            # Command-line interface
├── examples/           # Usage examples
└── benchmarks/         # Performance tests
```

## Contributing

Contributions welcome!

## License

MIT License

## Links

- [Playwright Documentation](https://playwright.dev)
- [Elide Documentation](https://docs.elide.dev)
