/**
 * Playwright Clone - E2E Test Examples
 */

import { test, expect } from '../src';

test.describe('E-Commerce Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example-shop.com');
  });

  test('should display product list', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Our Products');
    await expect(page.locator('.product-card')).toHaveCount(12);
  });

  test('should filter products by category', async ({ page }) => {
    await page.click('button.filter-electronics');
    await expect(page.locator('.product-card')).toHaveCount(5);
    await expect(page.locator('.category-badge')).toHaveText('Electronics');
  });

  test('should search for products', async ({ page }) => {
    await page.fill('input[name="search"]', 'laptop');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/search.*laptop/);
    await expect(page.locator('.product-card')).toHaveCount(3);
  });

  test('should add product to cart', async ({ page }) => {
    await page.click('.product-card:first-child .add-to-cart');
    await expect(page.locator('.cart-count')).toHaveText('1');

    await page.click('.product-card:nth-child(2) .add-to-cart');
    await expect(page.locator('.cart-count')).toHaveText('2');
  });

  test('should view cart', async ({ page }) => {
    // Add products
    await page.click('.product-card:first-child .add-to-cart');
    await page.click('.product-card:nth-child(2) .add-to-cart');

    // View cart
    await page.click('.cart-icon');
    await expect(page).toHaveURL(/cart/);
    await expect(page.locator('.cart-item')).toHaveCount(2);
  });

  test('should update cart quantity', async ({ page }) => {
    await page.click('.product-card:first-child .add-to-cart');
    await page.click('.cart-icon');

    await page.click('.cart-item .quantity-increase');
    await expect(page.locator('.cart-item .quantity-value')).toHaveText('2');

    await page.click('.cart-item .quantity-decrease');
    await expect(page.locator('.cart-item .quantity-value')).toHaveText('1');
  });

  test('should remove item from cart', async ({ page }) => {
    await page.click('.product-card:first-child .add-to-cart');
    await page.click('.cart-icon');

    await page.click('.cart-item .remove-button');
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await expect(page.locator('.empty-cart-message')).toBeVisible();
  });

  test('should proceed to checkout', async ({ page }) => {
    await page.click('.product-card:first-child .add-to-cart');
    await page.click('.cart-icon');
    await page.click('button.checkout');

    await expect(page).toHaveURL(/checkout/);
    await expect(page.locator('h1')).toHaveText('Checkout');
  });

  test('should complete checkout process', async ({ page }) => {
    // Add product
    await page.click('.product-card:first-child .add-to-cart');
    await page.click('.cart-icon');
    await page.click('button.checkout');

    // Fill shipping information
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="address"]', '123 Main St');
    await page.fill('input[name="city"]', 'New York');
    await page.fill('input[name="zip"]', '10001');
    await page.click('button.continue');

    // Fill payment information
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="cardExpiry"]', '12/25');
    await page.fill('input[name="cardCVC"]', '123');
    await page.click('button.place-order');

    // Verify success
    await expect(page).toHaveURL(/order-confirmation/);
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.order-number')).toContainText(/ORD-\d+/);
  });
});

test.describe('Login and Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('https://example-shop.com/login');

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('.user-name')).toHaveText('John Doe');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('https://example-shop.com/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Invalid email or password');
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('https://example-shop.com/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.click('.user-menu');
    await page.click('button.logout');

    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Product Details', () => {
  test('should display product details', async ({ page }) => {
    await page.goto('https://example-shop.com');
    await page.click('.product-card:first-child');

    await expect(page.locator('h1.product-title')).toBeVisible();
    await expect(page.locator('.product-price')).toBeVisible();
    await expect(page.locator('.product-description')).toBeVisible();
    await expect(page.locator('.product-image')).toBeVisible();
  });

  test('should select product variants', async ({ page }) => {
    await page.goto('https://example-shop.com/product/123');

    await page.selectOption('select[name="size"]', 'Large');
    await page.click('button[data-color="blue"]');

    await expect(page.locator('.selected-size')).toHaveText('Large');
    await expect(page.locator('.selected-color')).toHaveText('Blue');
  });

  test('should view product reviews', async ({ page }) => {
    await page.goto('https://example-shop.com/product/123');

    await page.click('tab.reviews');
    await expect(page.locator('.review')).toHaveCount(5);
    await expect(page.locator('.average-rating')).toContainText('4.5');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://example-shop.com');

    await expect(page.locator('.mobile-menu-button')).toBeVisible();
    await page.click('.mobile-menu-button');
    await expect(page.locator('.mobile-menu')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('https://example-shop.com');

    await expect(page.locator('.product-card')).toHaveCount(12);
  });
});

test.describe('Network Mocking', () => {
  test('should mock API responses', async ({ page }) => {
    await page.route('**/api/products', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Product 1', price: 99.99 },
          { id: 2, name: 'Product 2', price: 149.99 }
        ])
      });
    });

    await page.goto('https://example-shop.com');
    await expect(page.locator('.product-card')).toHaveCount(2);
  });

  test('should handle API errors', async ({ page }) => {
    await page.route('**/api/products', route => {
      route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });

    await page.goto('https://example-shop.com');
    await expect(page.locator('.error-message')).toBeVisible();
  });
});
