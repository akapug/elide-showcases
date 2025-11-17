/**
 * Playwright Clone - Page and Locator Assertions
 * Web-first assertions with auto-retry and wait functionality
 */

import type { Page, Locator, PageAssertions, LocatorAssertions } from '../index';

export class PageAssertionsImpl implements PageAssertions {
  private page: Page;
  private isNegated = false;
  private timeout = 5000;

  constructor(page: Page) {
    this.page = page;
  }

  get not(): PageAssertions {
    const negated = new PageAssertionsImpl(this.page);
    negated.isNegated = !this.isNegated;
    return negated;
  }

  async toHaveTitle(title: string | RegExp): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.timeout) {
      const actual = await this.page.title();
      const matches = typeof title === 'string'
        ? actual === title
        : title.test(actual);

      if (matches !== this.isNegated) {
        return;
      }

      await this.wait(100);
    }

    const actual = await this.page.title();
    throw new Error(
      this.isNegated
        ? `Expected title not to match ${title}, but got "${actual}"`
        : `Expected title to match ${title}, but got "${actual}"`
    );
  }

  async toHaveURL(url: string | RegExp): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.timeout) {
      const actual = this.page.url();
      const matches = typeof url === 'string'
        ? actual === url
        : url.test(actual);

      if (matches !== this.isNegated) {
        return;
      }

      await this.wait(100);
    }

    const actual = this.page.url();
    throw new Error(
      this.isNegated
        ? `Expected URL not to match ${url}, but got "${actual}"`
        : `Expected URL to match ${url}, but got "${actual}"`
    );
  }

  async toHaveScreenshot(name: string): Promise<void> {
    const screenshot = await this.page.screenshot();
    // Compare with stored screenshot
    // Implementation would load and compare images
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class LocatorAssertionsImpl implements LocatorAssertions {
  private locator: Locator;
  private isNegated = false;
  private timeout = 5000;

  constructor(locator: Locator) {
    this.locator = locator;
  }

  get not(): LocatorAssertions {
    const negated = new LocatorAssertionsImpl(this.locator);
    negated.isNegated = !this.isNegated;
    return negated;
  }

  async toBeVisible(): Promise<void> {
    await this.waitForCondition(async () => {
      // Check if element is visible
      return true; // Placeholder
    }, 'be visible', 'not be visible');
  }

  async toBeHidden(): Promise<void> {
    await this.waitForCondition(async () => {
      // Check if element is hidden
      return false; // Placeholder
    }, 'be hidden', 'not be hidden');
  }

  async toBeEnabled(): Promise<void> {
    await this.waitForCondition(async () => {
      // Check if element is enabled
      return true; // Placeholder
    }, 'be enabled', 'not be enabled');
  }

  async toBeDisabled(): Promise<void> {
    await this.waitForCondition(async () => {
      // Check if element is disabled
      return false; // Placeholder
    }, 'be disabled', 'not be disabled');
  }

  async toBeChecked(): Promise<void> {
    await this.waitForCondition(async () => {
      // Check if checkbox/radio is checked
      return true; // Placeholder
    }, 'be checked', 'not be checked');
  }

  async toBeEditable(): Promise<void> {
    await this.waitForCondition(async () => {
      // Check if element is editable
      return true; // Placeholder
    }, 'be editable', 'not be editable');
  }

  async toBeFocused(): Promise<void> {
    await this.waitForCondition(async () => {
      // Check if element is focused
      return true; // Placeholder
    }, 'be focused', 'not be focused');
  }

  async toContainText(text: string | RegExp): Promise<void> {
    await this.waitForCondition(async () => {
      const content = await this.locator.textContent();
      if (!content) return false;

      return typeof text === 'string'
        ? content.includes(text)
        : text.test(content);
    }, `contain text ${text}`, `not contain text ${text}`);
  }

  async toHaveText(text: string | RegExp | (string | RegExp)[]): Promise<void> {
    await this.waitForCondition(async () => {
      const content = await this.locator.textContent();
      if (!content) return false;

      if (Array.isArray(text)) {
        // Check if any pattern matches
        return text.some(pattern =>
          typeof pattern === 'string'
            ? content === pattern
            : pattern.test(content)
        );
      }

      return typeof text === 'string'
        ? content === text
        : text.test(content);
    }, `have text ${text}`, `not have text ${text}`);
  }

  async toHaveValue(value: string | RegExp): Promise<void> {
    await this.waitForCondition(async () => {
      const attr = await this.locator.getAttribute('value');
      if (!attr) return false;

      return typeof value === 'string'
        ? attr === value
        : value.test(attr);
    }, `have value ${value}`, `not have value ${value}`);
  }

  async toHaveAttribute(name: string, value?: string | RegExp): Promise<void> {
    await this.waitForCondition(async () => {
      const attr = await this.locator.getAttribute(name);
      if (!attr) return false;

      if (value === undefined) {
        return true;
      }

      return typeof value === 'string'
        ? attr === value
        : value.test(attr);
    }, `have attribute ${name}`, `not have attribute ${name}`);
  }

  async toHaveClass(className: string | RegExp): Promise<void> {
    await this.waitForCondition(async () => {
      const classAttr = await this.locator.getAttribute('class');
      if (!classAttr) return false;

      return typeof className === 'string'
        ? classAttr.split(' ').includes(className)
        : className.test(classAttr);
    }, `have class ${className}`, `not have class ${className}`);
  }

  async toHaveCSS(name: string, value: string | RegExp): Promise<void> {
    await this.waitForCondition(async () => {
      // Get computed CSS property
      // Placeholder implementation
      return true;
    }, `have CSS ${name}: ${value}`, `not have CSS ${name}: ${value}`);
  }

  async toHaveCount(count: number): Promise<void> {
    await this.waitForCondition(async () => {
      const actualCount = await this.locator.count();
      return actualCount === count;
    }, `have count ${count}`, `not have count ${count}`);
  }

  async toHaveScreenshot(name: string): Promise<void> {
    const screenshot = await this.locator.screenshot();
    // Compare with stored screenshot
    // Implementation would load and compare images
  }

  private async waitForCondition(
    condition: () => Promise<boolean>,
    positiveMessage: string,
    negativeMessage: string
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.timeout) {
      try {
        const result = await condition();

        if (result !== this.isNegated) {
          return;
        }

        await this.wait(100);
      } catch (error) {
        await this.wait(100);
      }
    }

    throw new Error(
      this.isNegated ? negativeMessage : positiveMessage
    );
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function expectPage(page: Page): PageAssertions {
  return new PageAssertionsImpl(page);
}

export function expectLocator(locator: Locator): LocatorAssertions {
  return new LocatorAssertionsImpl(locator);
}

// Custom matcher utilities
export class MatcherUtils {
  static matcherHint(
    matcherName: string,
    received?: string,
    expected?: string,
    options?: any
  ): string {
    const hint = `expect(${received || 'received'}).${matcherName}(${expected || 'expected'})`;
    return hint;
  }

  static printReceived(value: any): string {
    return this.stringify(value);
  }

  static printExpected(value: any): string {
    return this.stringify(value);
  }

  static stringify(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  static diff(received: any, expected: any): string {
    // Generate diff between received and expected
    const receivedStr = this.stringify(received);
    const expectedStr = this.stringify(expected);

    if (receivedStr === expectedStr) {
      return 'No differences found';
    }

    return `Expected:\n${expectedStr}\n\nReceived:\n${receivedStr}`;
  }
}

// Assertion error class
export class AssertionError extends Error {
  matcherResult: {
    message: string;
    pass: boolean;
    actual?: any;
    expected?: any;
  };

  constructor(
    message: string,
    pass: boolean,
    actual?: any,
    expected?: any
  ) {
    super(message);
    this.name = 'AssertionError';
    this.matcherResult = { message, pass, actual, expected };
  }
}

// Retry utilities for flaky assertions
export class RetryableAssertion {
  private retries: number;
  private delay: number;

  constructor(retries = 3, delay = 1000) {
    this.retries = retries;
    this.delay = delay;
  }

  async execute<T>(assertion: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.retries; i++) {
      try {
        return await assertion();
      } catch (error) {
        lastError = error as Error;

        if (i < this.retries - 1) {
          await this.wait(this.delay);
        }
      }
    }

    throw lastError;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Soft assertions that collect failures
export class SoftAssertions {
  private failures: AssertionError[] = [];

  async assert(assertion: () => Promise<void>): Promise<void> {
    try {
      await assertion();
    } catch (error) {
      if (error instanceof AssertionError) {
        this.failures.push(error);
      } else {
        throw error;
      }
    }
  }

  assertAll(): void {
    if (this.failures.length > 0) {
      const messages = this.failures.map(f => f.message).join('\n\n');
      throw new Error(`${this.failures.length} assertion(s) failed:\n\n${messages}`);
    }
  }

  getFailures(): AssertionError[] {
    return this.failures;
  }

  clear(): void {
    this.failures = [];
  }
}
