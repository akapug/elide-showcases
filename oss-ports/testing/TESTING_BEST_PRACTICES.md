# Testing Best Practices Guide

A comprehensive guide to writing effective, maintainable tests across all testing frameworks.

## General Principles

### 1. Test Pyramid

```
        /\
       /E2E\         Few E2E tests (slow, brittle)
      /------\
     /  Intg  \      Some integration tests (medium)
    /----------\
   /   Unit     \    Many unit tests (fast, stable)
  /--------------\
```

**Distribution:**
- 70% Unit Tests
- 20% Integration Tests
- 10% E2E Tests

### 2. AAA Pattern (Arrange-Act-Assert)

```typescript
describe('Calculator', () => {
  it('should add two numbers', () => {
    // Arrange - Set up test data
    const calculator = new Calculator();
    const a = 5;
    const b = 3;

    // Act - Execute the code being tested
    const result = calculator.add(a, b);

    // Assert - Verify the result
    expect(result).toBe(8);
  });
});
```

### 3. DRY but DAMP
- **DRY** (Don't Repeat Yourself) - Avoid code duplication
- **DAMP** (Descriptive And Meaningful Phrases) - Tests should be readable

```typescript
// Good: Each test is clear about what it tests
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const userData = { name: 'Alice', email: 'alice@example.com' };
    const user = await userService.create(userData);
    expect(user.name).toBe('Alice');
  });

  it('should reject user with invalid email', async () => {
    const userData = { name: 'Bob', email: 'invalid' };
    await expect(userService.create(userData)).rejects.toThrow('Invalid email');
  });
});

// Bad: Too DRY, unclear what each test does
describe('UserService', () => {
  const testCreate = (data, expectation) => {
    it('should handle creation', async () => {
      const result = await userService.create(data);
      expectation(result);
    });
  };

  testCreate({ name: 'Alice', email: 'alice@example.com' },
    r => expect(r.name).toBe('Alice'));
  testCreate({ name: 'Bob', email: 'invalid' },
    r => expect(r).toThrow());
});
```

## Unit Testing Best Practices

### Test Isolation

Each test should be completely independent:

```typescript
describe('TodoList', () => {
  let todoList: TodoList;

  beforeEach(() => {
    // Create fresh instance for each test
    todoList = new TodoList();
  });

  it('should add todo', () => {
    todoList.add('Buy milk');
    expect(todoList.count()).toBe(1);
  });

  it('should remove todo', () => {
    todoList.add('Buy milk');
    todoList.remove(0);
    expect(todoList.count()).toBe(0);
  });
});
```

### Test One Thing

Each test should verify one behavior:

```typescript
// Good: One test per behavior
it('should create user', () => {
  const user = userService.create({ name: 'Alice' });
  expect(user).toBeDefined();
});

it('should assign ID to new user', () => {
  const user = userService.create({ name: 'Alice' });
  expect(user.id).toBeGreaterThan(0);
});

it('should set creation timestamp', () => {
  const user = userService.create({ name: 'Alice' });
  expect(user.createdAt).toBeInstanceOf(Date);
});

// Bad: Testing multiple behaviors
it('should create user with all properties', () => {
  const user = userService.create({ name: 'Alice' });
  expect(user).toBeDefined();
  expect(user.id).toBeGreaterThan(0);
  expect(user.createdAt).toBeInstanceOf(Date);
  expect(user.name).toBe('Alice');
});
```

### Use Descriptive Test Names

```typescript
// Good: Clear what is being tested and expected
it('should return empty array when no users exist', () => {});
it('should throw error when email is invalid', () => {});
it('should calculate discount for premium users', () => {});

// Bad: Unclear or too generic
it('should work', () => {});
it('test user', () => {});
it('handles data', () => {});
```

### Test Edge Cases

```typescript
describe('String.reverse()', () => {
  it('should reverse normal string', () => {
    expect('hello'.reverse()).toBe('olleh');
  });

  it('should handle empty string', () => {
    expect(''.reverse()).toBe('');
  });

  it('should handle single character', () => {
    expect('a'.reverse()).toBe('a');
  });

  it('should handle special characters', () => {
    expect('!@#$%'.reverse()).toBe('%$#@!');
  });

  it('should handle unicode characters', () => {
    expect('👋🌍'.reverse()).toBe('🌍👋');
  });
});
```

### Mock External Dependencies

```typescript
describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockUserService = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    mockEmailService = {
      send: jest.fn()
    } as any;

    userController = new UserController(mockUserService, mockEmailService);
  });

  it('should create user and send welcome email', async () => {
    const userData = { name: 'Alice', email: 'alice@example.com' };
    mockUserService.create.mockResolvedValue({ id: 1, ...userData });

    await userController.register(userData);

    expect(mockUserService.create).toHaveBeenCalledWith(userData);
    expect(mockEmailService.send).toHaveBeenCalledWith(
      'alice@example.com',
      'Welcome!',
      expect.any(String)
    );
  });
});
```

## Integration Testing Best Practices

### Database Testing

```typescript
describe('User Repository Integration Tests', () => {
  let db: Database;

  beforeAll(async () => {
    // Connect to test database
    db = await Database.connect({
      host: 'localhost',
      database: 'test_db',
      user: 'test',
      password: 'test'
    });

    // Run migrations
    await db.migrate();
  });

  beforeEach(async () => {
    // Clean database before each test
    await db.truncate(['users', 'posts', 'comments']);
  });

  afterAll(async () => {
    // Close connection
    await db.disconnect();
  });

  it('should create user with unique email', async () => {
    const user = await db.users.create({
      name: 'Alice',
      email: 'alice@example.com'
    });

    expect(user.id).toBeDefined();

    // Attempting to create duplicate should fail
    await expect(
      db.users.create({
        name: 'Alice2',
        email: 'alice@example.com'
      })
    ).rejects.toThrow('Email already exists');
  });

  it('should cascade delete related records', async () => {
    const user = await db.users.create({
      name: 'Alice',
      email: 'alice@example.com'
    });

    const post = await db.posts.create({
      userId: user.id,
      title: 'Test Post'
    });

    await db.users.delete(user.id);

    // Related post should be deleted
    const deletedPost = await db.posts.findById(post.id);
    expect(deletedPost).toBeNull();
  });
});
```

### API Integration Testing

```typescript
describe('API Integration Tests', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    app = await createApp();
    server = app.listen(0); // Random port
  });

  afterAll(async () => {
    await server.close();
  });

  it('should create user via API', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Alice',
        email: 'alice@example.com'
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe('Alice');
  });

  it('should validate request body', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Alice'
        // Missing email
      })
      .expect(400);

    expect(response.body.errors).toContain('Email is required');
  });

  it('should authenticate requests', async () => {
    await request(app)
      .get('/api/users/me')
      .expect(401);

    await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.id).toBeDefined();
  });
});
```

## E2E Testing Best Practices

### Page Object Model

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return await this.page.textContent('.error-message');
  }

  isDisplayed() {
    return this.page.locator('h1:has-text("Login")').isVisible();
  }
}

// tests/login.spec.ts
test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginPage.login('user@example.com', 'password123');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show error with invalid credentials', async () => {
    await loginPage.login('wrong@example.com', 'wrong');
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Invalid credentials');
  });
});
```

### Use Data Attributes for Selectors

```typescript
// Good: Using data-testid
await page.click('[data-testid="submit-button"]');
await page.fill('[data-testid="email-input"]', 'user@example.com');

// Bad: Using implementation details
await page.click('.btn.btn-primary.submit-btn');
await page.fill('#root > div > form > input:nth-child(2)');
```

### Wait for Conditions, Not Time

```typescript
// Good: Wait for specific condition
await page.waitForSelector('.loading', { state: 'hidden' });
await page.waitForLoadState('networkidle');
await expect(page.locator('.result')).toBeVisible();

// Bad: Arbitrary waits
await page.waitForTimeout(3000);
await new Promise(resolve => setTimeout(resolve, 5000));
```

### Test User Journeys

```typescript
test('complete user journey', async ({ page }) => {
  // 1. Register
  await page.goto('/register');
  await page.fill('[data-testid="name"]', 'Alice');
  await page.fill('[data-testid="email"]', 'alice@example.com');
  await page.fill('[data-testid="password"]', 'SecurePass123!');
  await page.click('[data-testid="submit"]');

  // 2. Verify email (simulated)
  await page.goto('/verify?token=abc123');
  await expect(page.locator('.success-message')).toBeVisible();

  // 3. Login
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'alice@example.com');
  await page.fill('[data-testid="password"]', 'SecurePass123!');
  await page.click('[data-testid="submit"]');

  // 4. Complete profile
  await page.goto('/profile/edit');
  await page.fill('[data-testid="bio"]', 'Software developer');
  await page.click('[data-testid="save"]');

  // 5. Create post
  await page.goto('/posts/new');
  await page.fill('[data-testid="title"]', 'My First Post');
  await page.fill('[data-testid="content"]', 'Hello world!');
  await page.click('[data-testid="publish"]');

  // Verify complete journey
  await expect(page).toHaveURL(/\/posts\/\d+/);
  await expect(page.locator('.post-title')).toHaveText('My First Post');
});
```

## Test Data Management

### Factories

```typescript
// factories/user.factory.ts
export class UserFactory {
  private static id = 1;

  static create(overrides: Partial<User> = {}): User {
    return {
      id: this.id++,
      name: 'Test User',
      email: `user${this.id}@example.com`,
      role: 'user',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createAdmin(overrides: Partial<User> = {}): User {
    return this.create({ role: 'admin', ...overrides });
  }

  static createMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

// Usage in tests
describe('User permissions', () => {
  it('should allow admin to delete users', () => {
    const admin = UserFactory.createAdmin();
    const user = UserFactory.create();

    expect(canDelete(admin, user)).toBe(true);
  });

  it('should not allow regular user to delete users', () => {
    const user1 = UserFactory.create();
    const user2 = UserFactory.create();

    expect(canDelete(user1, user2)).toBe(false);
  });
});
```

### Fixtures

```typescript
// fixtures/users.json
{
  "admin": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "regular": {
    "id": 2,
    "name": "Regular User",
    "email": "user@example.com",
    "role": "user"
  }
}

// tests/auth.test.ts
import users from '../fixtures/users.json';

describe('Authentication', () => {
  it('should authenticate admin', () => {
    const result = authenticate(users.admin.email, 'password');
    expect(result.role).toBe('admin');
  });
});
```

## Performance Testing

### Measuring Test Performance

```typescript
describe('Performance tests', () => {
  it('should sort large array quickly', () => {
    const array = Array.from({ length: 10000 }, () => Math.random());

    const start = Date.now();
    array.sort((a, b) => a - b);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should search in reasonable time', () => {
    const data = generateLargeDataset(100000);

    const start = Date.now();
    const result = binarySearch(data, 50000);
    const duration = Date.now() - start;

    expect(result).toBeDefined();
    expect(duration).toBeLessThan(10);
  });
});
```

### Load Testing

```typescript
describe('Load tests', () => {
  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 100 }, () =>
      fetch('/api/data')
    );

    const start = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;

    expect(responses.every(r => r.ok)).toBe(true);
    expect(duration).toBeLessThan(5000);
  });
});
```

## Test Coverage

### Measuring Coverage

```typescript
// jest.config.ts
export default {
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ]
};
```

### Coverage Goals

- **Critical paths:** 100% coverage
- **Business logic:** 90%+ coverage
- **Utilities:** 80%+ coverage
- **UI components:** 70%+ coverage

### Don't Chase 100%

Focus on meaningful coverage, not numbers:

```typescript
// Low value: Testing trivial code
it('should return sum', () => {
  expect(add(2, 3)).toBe(5);
});

// High value: Testing edge cases
it('should handle overflow', () => {
  expect(add(Number.MAX_VALUE, 1)).toBe(Number.MAX_VALUE);
});

it('should handle negative numbers', () => {
  expect(add(-5, 3)).toBe(-2);
});
```

## Common Anti-Patterns

### 1. Testing Implementation Details

```typescript
// Bad: Testing internal state
it('should update internal counter', () => {
  const service = new Service();
  service.doSomething();
  expect(service._counter).toBe(1); // Private property
});

// Good: Testing behavior
it('should track number of operations', () => {
  const service = new Service();
  service.doSomething();
  expect(service.getOperationCount()).toBe(1);
});
```

### 2. Fragile Selectors

```typescript
// Bad: Brittle CSS selectors
cy.get('.container > div:nth-child(3) > button.primary');

// Good: Semantic selectors
cy.get('[data-testid="submit-button"]');
```

### 3. Shared State

```typescript
// Bad: Tests depend on execution order
let userId;

it('should create user', () => {
  userId = createUser();
});

it('should get user', () => {
  const user = getUser(userId); // Depends on previous test
});

// Good: Independent tests
it('should create and get user', () => {
  const userId = createUser();
  const user = getUser(userId);
  expect(user).toBeDefined();
});
```

### 4. Excessive Mocking

```typescript
// Bad: Mocking everything
it('should process order', () => {
  const mockValidator = jest.fn();
  const mockCalculator = jest.fn();
  const mockEmailer = jest.fn();
  const mockLogger = jest.fn();
  const mockDatabase = jest.fn();

  // Test tells us nothing about real behavior
});

// Good: Mock only external dependencies
it('should process order', () => {
  const mockEmailer = jest.fn();
  const mockDatabase = jest.fn();

  // Real validation and calculation
  const order = processOrder(data, { emailer: mockEmailer, db: mockDatabase });

  expect(order.total).toBe(100);
  expect(mockEmailer).toHaveBeenCalled();
});
```

## Debugging Tests

### Enable Debug Output

```typescript
// Jest/Vitest
DEBUG=* npm test

// Playwright
await page.pause(); // Interactive debugging
await page.screenshot({ path: 'debug.png' });

// Cypress
cy.debug();
cy.pause();
```

### Use Test Isolation

```typescript
// Run single test
it.only('this test only', () => {});

// Skip other tests
it.skip('skip this', () => {});
```

### Add Debug Logging

```typescript
it('should process data', () => {
  const data = getData();
  console.log('Input data:', data);

  const result = process(data);
  console.log('Result:', result);

  expect(result).toBeDefined();
});
```

## CI/CD Integration

### Fast Feedback

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  fast-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm run test:unit # Fast unit tests first

  integration-tests:
    runs-on: ubuntu-latest
    needs: fast-tests # Only run if unit tests pass
    steps:
      - uses: actions/checkout@v2
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests # Only run if integration tests pass
    steps:
      - uses: actions/checkout@v2
      - run: npm run test:e2e
```

### Parallel Execution

```bash
# Run tests in parallel
npm test -- --maxWorkers=4

# Playwright parallel
playwright test --workers=4

# Cypress parallel (with dashboard)
cypress run --parallel --record
```

## Summary

- ✅ Write independent, isolated tests
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Follow AAA pattern
- ✅ Mock external dependencies
- ✅ Test edge cases
- ✅ Maintain reasonable coverage
- ✅ Use Page Object Model for E2E
- ✅ Prefer semantic selectors
- ✅ Keep tests fast and focused
- ❌ Don't share state between tests
- ❌ Don't test implementation details
- ❌ Don't mock everything
- ❌ Don't chase 100% coverage

Remember: **Good tests are your safety net, not your burden.**
