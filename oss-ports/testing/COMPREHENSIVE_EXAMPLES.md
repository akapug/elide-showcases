# Comprehensive Testing Examples

This guide provides detailed examples for all testing scenarios across all frameworks.

## Table of Contents
1. [Unit Testing Examples](#unit-testing-examples)
2. [Integration Testing Examples](#integration-testing-examples)
3. [E2E Testing Examples](#e2e-testing-examples)
4. [Mocking Examples](#mocking-examples)
5. [Async Testing Examples](#async-testing-examples)
6. [Advanced Patterns](#advanced-patterns)

## Unit Testing Examples

### Basic Assertions

#### Jest/Vitest
```typescript
describe('String utilities', () => {
  it('should capitalize first letter', () => {
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
    expect(capitalize('')).toBe('');
  });

  it('should reverse string', () => {
    const reverse = (str: string) => str.split('').reverse().join('');
    expect(reverse('hello')).toBe('olleh');
    expect(reverse('test')).toBe('tset');
    expect(reverse('')).toBe('');
  });

  it('should check if string is palindrome', () => {
    const isPalindrome = (str: string) => {
      const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleaned === cleaned.split('').reverse().join('');
    };

    expect(isPalindrome('racecar')).toBe(true);
    expect(isPalindrome('A man, a plan, a canal: Panama')).toBe(true);
    expect(isPalindrome('hello')).toBe(false);
  });

  it('should count word occurrences', () => {
    const countWords = (str: string) => {
      const words = str.toLowerCase().match(/\b\w+\b/g) || [];
      return words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    };

    const result = countWords('the quick brown fox jumps over the lazy dog');
    expect(result.the).toBe(2);
    expect(result.quick).toBe(1);
    expect(result.fox).toBe(1);
  });
});

describe('Array utilities', () => {
  it('should find unique elements', () => {
    const unique = <T,>(arr: T[]) => [...new Set(arr)];
    expect(unique([1, 2, 2, 3, 3, 3, 4])).toEqual([1, 2, 3, 4]);
    expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('should flatten nested arrays', () => {
    const flatten = <T,>(arr: any[]): T[] => {
      return arr.reduce((acc, val) =>
        Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);
    };

    expect(flatten([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
    expect(flatten([[1, 2], [3, 4], [5]])).toEqual([1, 2, 3, 4, 5]);
  });

  it('should chunk array', () => {
    const chunk = <T,>(arr: T[], size: number): T[][] => {
      const chunks: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk(['a', 'b', 'c', 'd'], 3)).toEqual([['a', 'b', 'c'], ['d']]);
  });

  it('should group by property', () => {
    const groupBy = <T,>(arr: T[], key: keyof T): Record<string, T[]> => {
      return arr.reduce((acc, item) => {
        const group = String(item[key]);
        acc[group] = acc[group] || [];
        acc[group].push(item);
        return acc;
      }, {} as Record<string, T[]>);
    };

    const users = [
      { name: 'Alice', role: 'admin' },
      { name: 'Bob', role: 'user' },
      { name: 'Charlie', role: 'admin' }
    ];

    const grouped = groupBy(users, 'role');
    expect(grouped.admin).toHaveLength(2);
    expect(grouped.user).toHaveLength(1);
  });
});

describe('Object utilities', () => {
  it('should deep clone object', () => {
    const deepClone = <T,>(obj: T): T => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(deepClone) as any;

      const cloned = {} as T;
      for (const key in obj) {
        cloned[key] = deepClone(obj[key]);
      }
      return cloned;
    };

    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });

  it('should merge objects', () => {
    const merge = <T extends object, U extends object>(obj1: T, obj2: U): T & U => {
      return { ...obj1, ...obj2 };
    };

    const result = merge({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should pick properties', () => {
    const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
      const picked = {} as Pick<T, K>;
      for (const key of keys) {
        picked[key] = obj[key];
      }
      return picked;
    };

    const user = { id: 1, name: 'Alice', email: 'alice@example.com', password: 'secret' };
    const safe = pick(user, ['id', 'name', 'email']);

    expect(safe).toEqual({ id: 1, name: 'Alice', email: 'alice@example.com' });
    expect('password' in safe).toBe(false);
  });

  it('should omit properties', () => {
    const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
      const result = { ...obj };
      for (const key of keys) {
        delete result[key];
      }
      return result;
    };

    const user = { id: 1, name: 'Alice', password: 'secret' };
    const safe = omit(user, ['password']);

    expect(safe).toEqual({ id: 1, name: 'Alice' });
    expect('password' in safe).toBe(false);
  });
});
```

#### Mocha
```typescript
describe('Math operations', () => {
  it('should add numbers', () => {
    expect(2 + 2).to.equal(4);
    expect(10 + 5).to.equal(15);
  });

  it('should subtract numbers', () => {
    expect(10 - 5).to.equal(5);
    expect(0 - 5).to.equal(-5);
  });

  it('should multiply numbers', () => {
    expect(3 * 4).to.equal(12);
    expect(5 * 0).to.equal(0);
  });

  it('should divide numbers', () => {
    expect(10 / 2).to.equal(5);
    expect(9 / 3).to.equal(3);
  });

  it('should handle edge cases', () => {
    expect(1 / 0).to.equal(Infinity);
    expect(0 / 0).to.be.NaN;
  });
});
```

## Integration Testing Examples

### API Testing

```typescript
describe('User API', () => {
  let userId: number;

  beforeEach(async () => {
    // Setup: Create test user
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com' })
    });
    const user = await response.json();
    userId = user.id;
  });

  afterEach(async () => {
    // Cleanup: Delete test user
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
  });

  it('should get user by ID', async () => {
    const response = await fetch(`/api/users/${userId}`);
    const user = await response.json();

    expect(response.status).toBe(200);
    expect(user.id).toBe(userId);
    expect(user.name).toBe('Test User');
  });

  it('should update user', async () => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated User' })
    });
    const user = await response.json();

    expect(response.status).toBe(200);
    expect(user.name).toBe('Updated User');
  });

  it('should list all users', async () => {
    const response = await fetch('/api/users');
    const users = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });
});
```

### Database Testing

```typescript
describe('User Repository', () => {
  let db: Database;

  beforeAll(async () => {
    db = await connectDatabase();
    await db.migrate();
  });

  beforeEach(async () => {
    await db.clear();
    await db.seed();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should create user', async () => {
    const user = await db.users.create({
      name: 'John Doe',
      email: 'john@example.com'
    });

    expect(user.id).toBeDefined();
    expect(user.name).toBe('John Doe');
  });

  it('should find user by email', async () => {
    await db.users.create({ name: 'Alice', email: 'alice@example.com' });
    const user = await db.users.findByEmail('alice@example.com');

    expect(user).toBeDefined();
    expect(user?.name).toBe('Alice');
  });

  it('should update user', async () => {
    const user = await db.users.create({ name: 'Bob', email: 'bob@example.com' });
    await db.users.update(user.id, { name: 'Robert' });
    const updated = await db.users.findById(user.id);

    expect(updated?.name).toBe('Robert');
  });

  it('should delete user', async () => {
    const user = await db.users.create({ name: 'Charlie', email: 'charlie@example.com' });
    await db.users.delete(user.id);
    const deleted = await db.users.findById(user.id);

    expect(deleted).toBeNull();
  });
});
```

## E2E Testing Examples

### Playwright Examples

```typescript
test.describe('E-commerce Flow', () => {
  test('should complete purchase', async ({ page }) => {
    // Navigate to store
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Welcome to Our Store');

    // Browse products
    await page.click('text=Electronics');
    await expect(page.locator('.product-card')).toHaveCount(12);

    // Search for specific product
    await page.fill('input[name="search"]', 'laptop');
    await page.press('input[name="search"]', 'Enter');
    await page.waitForURL(/search.*laptop/);

    // View product details
    await page.click('.product-card:first-child');
    await expect(page.locator('.product-title')).toBeVisible();
    await expect(page.locator('.product-price')).toBeVisible();

    // Add to cart
    await page.click('button.add-to-cart');
    await expect(page.locator('.cart-count')).toHaveText('1');

    // View cart
    await page.click('.cart-icon');
    await expect(page).toHaveURL(/cart/);
    await expect(page.locator('.cart-item')).toHaveCount(1);

    // Proceed to checkout
    await page.click('button.checkout');
    await expect(page).toHaveURL(/checkout/);

    // Fill shipping info
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="address"]', '123 Main St');
    await page.fill('input[name="city"]', 'New York');
    await page.fill('input[name="zip"]', '10001');
    await page.click('button.continue');

    // Fill payment info
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="cardExpiry"]', '12/25');
    await page.fill('input[name="cardCVC"]', '123');
    await page.click('button.place-order');

    // Verify order confirmation
    await expect(page).toHaveURL(/order-confirmation/);
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.order-number')).toContainText(/ORD-\d+/);
  });

  test('should filter products', async ({ page }) => {
    await page.goto('/');

    // Filter by category
    await page.click('text=Electronics');
    await expect(page.locator('.product-card')).toHaveCount(12);

    // Filter by price range
    await page.fill('input[name="minPrice"]', '100');
    await page.fill('input[name="maxPrice"]', '500');
    await page.click('button.apply-filters');
    await page.waitForLoadState('networkidle');

    // Verify filtered results
    const prices = await page.locator('.product-price').allTextContents();
    for (const price of prices) {
      const amount = parseFloat(price.replace('$', ''));
      expect(amount).toBeGreaterThanOrEqual(100);
      expect(amount).toBeLessThanOrEqual(500);
    }
  });

  test('should handle form validation', async ({ page }) => {
    await page.goto('/contact');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Check validation messages
    await expect(page.locator('.error-message:has-text("Name is required")')).toBeVisible();
    await expect(page.locator('.error-message:has-text("Email is required")')).toBeVisible();

    // Fill invalid email
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message:has-text("Invalid email")')).toBeVisible();

    // Fill valid data
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('textarea[name="message"]', 'Hello, I have a question');
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### Cypress Examples

```typescript
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should register new user', () => {
    cy.get('a:contains("Sign Up")').click();
    cy.url().should('include', '/register');

    // Fill registration form
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type('john@example.com');
    cy.get('input[name="password"]').type('SecurePassword123!');
    cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
    cy.get('input[type="checkbox"][name="terms"]').check();

    // Submit form
    cy.get('button[type="submit"]').click();

    // Verify registration
    cy.url().should('include', '/dashboard');
    cy.get('.welcome-message').should('contain', 'Welcome, John');
  });

  it('should login existing user', () => {
    cy.get('a:contains("Sign In")').click();

    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('.user-name').should('be.visible');
  });

  it('should handle invalid credentials', () => {
    cy.get('a:contains("Sign In")').click();

    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.get('.error-message').should('contain', 'Invalid credentials');
    cy.url().should('include', '/login');
  });

  it('should logout user', () => {
    // Login first
    cy.login('user@example.com', 'password123');

    // Logout
    cy.get('.user-menu').click();
    cy.get('button:contains("Logout")').click();

    cy.url().should('include', '/');
    cy.get('.user-name').should('not.exist');
  });

  it('should reset password', () => {
    cy.visit('/login');
    cy.get('a:contains("Forgot Password")').click();

    cy.get('input[name="email"]').type('user@example.com');
    cy.get('button[type="submit"]').click();

    cy.get('.success-message').should('contain', 'Password reset email sent');
  });
});

describe('Dashboard Operations', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password123');
    cy.visit('/dashboard');
  });

  it('should create new project', () => {
    cy.get('button:contains("New Project")').click();

    cy.get('input[name="name"]').type('My Project');
    cy.get('textarea[name="description"]').type('Project description');
    cy.get('select[name="category"]').select('Web Development');
    cy.get('button[type="submit"]').click();

    cy.get('.project-list').should('contain', 'My Project');
  });

  it('should edit project', () => {
    cy.get('.project-card:first .edit-button').click();

    cy.get('input[name="name"]').clear().type('Updated Project');
    cy.get('button[type="submit"]').click();

    cy.get('.project-list').should('contain', 'Updated Project');
  });

  it('should delete project', () => {
    cy.get('.project-card:first .delete-button').click();

    cy.get('.confirm-modal').should('be.visible');
    cy.get('.confirm-modal button:contains("Delete")').click();

    cy.get('.success-message').should('contain', 'Project deleted');
  });

  it('should search projects', () => {
    cy.get('input[name="search"]').type('Web');

    cy.get('.project-card').should('have.length.greaterThan', 0);
    cy.get('.project-card').each(($card) => {
      cy.wrap($card).should('contain', 'Web');
    });
  });
});
```

## Mocking Examples

### Function Mocking

```typescript
describe('Email Service', () => {
  it('should send welcome email', () => {
    const sendEmail = jest.fn();
    const emailService = { send: sendEmail };

    emailService.send('user@example.com', 'Welcome!', 'Welcome to our service');

    expect(sendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Welcome!',
      'Welcome to our service'
    );
  });

  it('should retry on failure', async () => {
    const sendEmail = jest.fn();

    sendEmail
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ success: true });

    const result = await retryOperation(() => sendEmail(), 3);

    expect(result.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(3);
  });
});
```

### Module Mocking

```typescript
// api.ts
export async function fetchUser(id: number) {
  const response = await fetch(`/api/users/${id}`);
  return await response.json();
}

// api.test.ts
jest.mock('./api');

describe('User Component', () => {
  it('should display user data', async () => {
    const mockFetchUser = jest.fn();
    mockFetchUser.mockResolvedValue({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com'
    });

    const user = await mockFetchUser(1);

    expect(user.name).toBe('Alice');
    expect(mockFetchUser).toHaveBeenCalledWith(1);
  });
});
```

### Timer Mocking

```typescript
describe('Debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce function calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 1000);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throttle function calls', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 1000);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

## Async Testing Examples

### Promise Testing

```typescript
describe('Async operations', () => {
  it('should handle successful promise', async () => {
    const fetchData = () => Promise.resolve({ data: 'success' });
    const result = await fetchData();
    expect(result.data).toBe('success');
  });

  it('should handle promise rejection', async () => {
    const fetchError = () => Promise.reject(new Error('Failed'));
    await expect(fetchError()).rejects.toThrow('Failed');
  });

  it('should handle multiple promises', async () => {
    const promises = [
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3)
    ];

    const results = await Promise.all(promises);
    expect(results).toEqual([1, 2, 3]);
  });

  it('should handle promise race', async () => {
    const fast = new Promise(resolve => setTimeout(() => resolve('fast'), 10));
    const slow = new Promise(resolve => setTimeout(() => resolve('slow'), 100));

    const result = await Promise.race([fast, slow]);
    expect(result).toBe('fast');
  });
});
```

### Callback Testing

```typescript
describe('Callback functions', () => {
  it('should handle callbacks', (done) => {
    function asyncOperation(callback: (error: Error | null, result?: string) => void) {
      setTimeout(() => callback(null, 'success'), 100);
    }

    asyncOperation((error, result) => {
      expect(error).toBeNull();
      expect(result).toBe('success');
      done();
    });
  });
});
```

## Advanced Patterns

### Factory Functions

```typescript
function createUser(overrides = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    ...overrides
  };
}

describe('User factory', () => {
  it('should create user with defaults', () => {
    const user = createUser();
    expect(user.name).toBe('Test User');
  });

  it('should create user with overrides', () => {
    const user = createUser({ name: 'Alice' });
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('test@example.com');
  });
});
```

### Test Data Builders

```typescript
class UserBuilder {
  private user = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user' as const
  };

  withName(name: string) {
    this.user.name = name;
    return this;
  }

  withEmail(email: string) {
    this.user.email = email;
    return this;
  }

  asAdmin() {
    this.user.role = 'admin';
    return this;
  }

  build() {
    return { ...this.user };
  }
}

describe('User builder', () => {
  it('should build user', () => {
    const user = new UserBuilder()
      .withName('Alice')
      .withEmail('alice@example.com')
      .asAdmin()
      .build();

    expect(user.name).toBe('Alice');
    expect(user.role).toBe('admin');
  });
});
```

### Snapshot Testing

```typescript
describe('Component snapshots', () => {
  it('should match snapshot', () => {
    const component = {
      type: 'div',
      props: { className: 'container' },
      children: [
        { type: 'h1', children: ['Hello World'] },
        { type: 'p', children: ['Welcome to our app'] }
      ]
    };

    expect(component).toMatchSnapshot();
  });
});
```

This comprehensive guide covers testing scenarios across all frameworks, providing practical examples that can be adapted to your specific needs.
