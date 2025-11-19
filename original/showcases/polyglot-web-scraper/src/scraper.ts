/**
 * Polyglot Web Scraper - Main Scraper Class
 *
 * Demonstrates Elide's polyglot capabilities by importing Python scraping libraries
 * directly into TypeScript for a unified, type-safe scraping experience.
 */

// @ts-ignore - Elide polyglot import: Python requests library
import requests from 'python:requests';

// @ts-ignore - Elide polyglot import: BeautifulSoup4 for HTML parsing
import bs4 from 'python:bs4';

// @ts-ignore - Elide polyglot import: Selenium for browser automation
import selenium from 'python:selenium';

// @ts-ignore - Elide polyglot import: lxml for XML parsing
import lxml from 'python:lxml';

// @ts-ignore - Elide polyglot import: urllib for URL parsing
import urllib from 'python:urllib';

// @ts-ignore - Elide polyglot import: time for delays
import time from 'python:time';

// @ts-ignore - Elide polyglot import: json for data handling
import json from 'python:json';

// @ts-ignore - Elide polyglot import: re for regex
import re from 'python:re';

/**
 * Configuration options for the PolygotScraper
 */
export interface ScraperConfig {
  /** User agent string for HTTP requests */
  userAgent?: string;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Number of retry attempts on failure */
  retries?: number;

  /** Delay between retries in milliseconds */
  retryDelay?: number;

  /** Rate limiting - minimum delay between requests (ms) */
  rateLimit?: number;

  /** Maximum concurrent requests */
  concurrent?: number;

  /** Custom headers for requests */
  headers?: Record<string, string>;

  /** Proxy configuration */
  proxies?: {
    http?: string;
    https?: string;
  };

  /** Enable session management (cookies, etc.) */
  session?: boolean;

  /** Cache configuration */
  cache?: {
    enabled: boolean;
    ttl?: number;
    storage?: string;
  };

  /** Enable JavaScript rendering for dynamic content */
  renderJS?: boolean;

  /** Wait for selector before scraping (when renderJS enabled) */
  waitForSelector?: string;

  /** Maximum wait time for JavaScript rendering (ms) */
  waitTime?: number;

  /** Data validation rules */
  validate?: {
    required?: string[];
    types?: Record<string, string>;
    patterns?: Record<string, RegExp>;
  };

  /** Backoff strategy */
  backoff?: 'linear' | 'exponential' | 'fibonacci';

  /** Enable rotating user agents */
  rotateUserAgents?: boolean;

  /** Enable rotating proxies */
  rotateProxies?: boolean;

  /** Cookie persistence file */
  persistCookies?: string;
}

/**
 * Response interface for scraping operations
 */
export interface ScrapeResponse {
  /** HTTP status code */
  statusCode: number;

  /** Response headers */
  headers: Record<string, string>;

  /** Response body as text */
  text: string;

  /** Response body as parsed JSON */
  json?: any;

  /** Final URL after redirects */
  url: string;

  /** Response time in milliseconds */
  responseTime: number;

  /** Whether response was served from cache */
  cached?: boolean;
}

/**
 * Scraped data interface
 */
export interface ScrapedData {
  /** Extracted data */
  data: any;

  /** Metadata about the scraping operation */
  metadata: {
    url: string;
    scrapedAt: Date;
    method: 'static' | 'dynamic' | 'api';
    responseTime: number;
    retries: number;
  };
}

/**
 * Main PolygotScraper class - combines Python scraping power with TypeScript type safety
 */
export class PolygotScraper {
  private config: ScraperConfig;
  private session: any | null = null;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private userAgents: string[];
  private currentUserAgentIndex: number = 0;

  /**
   * Initialize the polyglot scraper
   */
  constructor(config: ScraperConfig = {}) {
    this.config = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      rateLimit: 1000,
      concurrent: 5,
      backoff: 'exponential',
      ...config
    };

    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];

    // Initialize session if enabled
    if (this.config.session) {
      this.session = requests.Session();

      // Load persisted cookies if configured
      if (this.config.persistCookies) {
        this.loadCookies();
      }
    }
  }

  /**
   * Scrape static HTML content using requests + BeautifulSoup
   */
  async scrapeStatic(url: string, options: {
    method?: 'GET' | 'POST';
    data?: any;
    params?: Record<string, string>;
    selector?: string;
  } = {}): Promise<ScrapedData> {
    const startTime = Date.now();
    let retries = 0;

    while (retries <= (this.config.retries || 0)) {
      try {
        // Apply rate limiting
        await this.applyRateLimit();

        // Check cache
        if (this.config.cache?.enabled) {
          const cached = this.getFromCache(url);
          if (cached) {
            return {
              data: cached,
              metadata: {
                url,
                scrapedAt: new Date(),
                method: 'static',
                responseTime: Date.now() - startTime,
                retries
              }
            };
          }
        }

        // Make HTTP request using Python requests
        const headers = this.getHeaders();
        const timeout = (this.config.timeout || 30000) / 1000; // Convert to seconds

        let response;
        if (this.session) {
          response = this.session.request(
            options.method || 'GET',
            url,
            {
              headers,
              timeout,
              params: options.params,
              data: options.data,
              proxies: this.config.proxies
            }
          );
        } else {
          if (options.method === 'POST') {
            response = requests.post(url, {
              headers,
              timeout,
              data: options.data,
              proxies: this.config.proxies
            });
          } else {
            response = requests.get(url, {
              headers,
              timeout,
              params: options.params,
              proxies: this.config.proxies
            });
          }
        }

        // Check status code
        if (response.status_code >= 400) {
          throw new Error(`HTTP ${response.status_code}: ${response.reason}`);
        }

        // Parse HTML with BeautifulSoup
        const soup = new bs4.BeautifulSoup(response.text, 'html.parser');

        // Extract data based on selector if provided
        let data;
        if (options.selector) {
          const elements = soup.select(options.selector);
          data = elements.map((el: any) => this.elementToObject(el));
        } else {
          data = soup;
        }

        // Cache result
        if (this.config.cache?.enabled) {
          this.setCache(url, data);
        }

        // Persist cookies if configured
        if (this.config.persistCookies && this.session) {
          this.saveCookies();
        }

        return {
          data,
          metadata: {
            url: response.url,
            scrapedAt: new Date(),
            method: 'static',
            responseTime: Date.now() - startTime,
            retries
          }
        };

      } catch (error) {
        retries++;

        if (retries > (this.config.retries || 0)) {
          throw new Error(`Failed to scrape ${url} after ${retries} attempts: ${error}`);
        }

        // Apply backoff strategy
        const delay = this.calculateBackoff(retries);
        await this.sleep(delay);
      }
    }

    throw new Error('Unexpected error in scrapeStatic');
  }

  /**
   * Scrape dynamic content using Selenium for JavaScript rendering
   */
  async scrapeDynamic(url: string, options: {
    browser?: 'chrome' | 'firefox' | 'safari';
    headless?: boolean;
    waitForSelector?: string;
    waitTime?: number;
    executeScript?: string;
    screenshot?: string;
  } = {}): Promise<ScrapedData> {
    const startTime = Date.now();
    let driver: any = null;

    try {
      // Initialize Selenium WebDriver
      const browserOptions = this.getSeleniumOptions(options.browser || 'chrome', options.headless !== false);

      if (options.browser === 'firefox') {
        driver = new selenium.webdriver.Firefox(browserOptions);
      } else {
        driver = new selenium.webdriver.Chrome(browserOptions);
      }

      // Navigate to URL
      await driver.get(url);

      // Wait for JavaScript to render
      const waitSelector = options.waitForSelector || this.config.waitForSelector;
      const waitTime = (options.waitTime || this.config.waitTime || 5000) / 1000;

      if (waitSelector) {
        const By = selenium.webdriver.common.by.By;
        const until = selenium.webdriver.support.ui.until;

        await driver.wait(
          until.elementLocated(By.CSS_SELECTOR, waitSelector),
          waitTime * 1000
        );
      } else {
        // Default wait for page load
        await this.sleep(waitTime * 1000);
      }

      // Execute custom JavaScript if provided
      if (options.executeScript) {
        await driver.execute_script(options.executeScript);
      }

      // Take screenshot if requested
      if (options.screenshot) {
        await driver.save_screenshot(options.screenshot);
      }

      // Get page source
      const pageSource = await driver.page_source;

      // Parse with BeautifulSoup
      const soup = new bs4.BeautifulSoup(pageSource, 'html.parser');

      return {
        data: soup,
        metadata: {
          url: await driver.current_url,
          scrapedAt: new Date(),
          method: 'dynamic',
          responseTime: Date.now() - startTime,
          retries: 0
        }
      };

    } finally {
      // Always close the browser
      if (driver) {
        await driver.quit();
      }
    }
  }

  /**
   * Scrape API endpoints with JSON responses
   */
  async scrapeAPI(url: string, options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    params?: Record<string, string>;
    auth?: {
      username: string;
      password: string;
    } | {
      token: string;
    };
  } = {}): Promise<ScrapedData> {
    const startTime = Date.now();
    let retries = 0;

    while (retries <= (this.config.retries || 0)) {
      try {
        await this.applyRateLimit();

        const headers = {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        // Add authentication if provided
        if (options.auth && 'token' in options.auth) {
          headers['Authorization'] = `Bearer ${options.auth.token}`;
        }

        const timeout = (this.config.timeout || 30000) / 1000;

        let response;
        const requestOptions: any = {
          headers,
          timeout,
          params: options.params,
          proxies: this.config.proxies
        };

        if (options.auth && 'username' in options.auth) {
          requestOptions.auth = [options.auth.username, options.auth.password];
        }

        if (options.data) {
          requestOptions.json = options.data;
        }

        switch (options.method) {
          case 'POST':
            response = requests.post(url, requestOptions);
            break;
          case 'PUT':
            response = requests.put(url, requestOptions);
            break;
          case 'DELETE':
            response = requests.delete(url, requestOptions);
            break;
          default:
            response = requests.get(url, requestOptions);
        }

        if (response.status_code >= 400) {
          throw new Error(`API Error ${response.status_code}: ${response.text}`);
        }

        const data = response.json();

        return {
          data,
          metadata: {
            url: response.url,
            scrapedAt: new Date(),
            method: 'api',
            responseTime: Date.now() - startTime,
            retries
          }
        };

      } catch (error) {
        retries++;

        if (retries > (this.config.retries || 0)) {
          throw new Error(`API request failed after ${retries} attempts: ${error}`);
        }

        const delay = this.calculateBackoff(retries);
        await this.sleep(delay);
      }
    }

    throw new Error('Unexpected error in scrapeAPI');
  }

  /**
   * Scrape multiple URLs concurrently
   */
  async scrapeMultiple(
    urls: string[],
    scraper: (url: string) => Promise<ScrapedData>,
    options: {
      concurrent?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<ScrapedData[]> {
    const concurrent = options.concurrent || this.config.concurrent || 5;
    const results: ScrapedData[] = [];
    let completed = 0;

    for (let i = 0; i < urls.length; i += concurrent) {
      const batch = urls.slice(i, i + concurrent);
      const batchResults = await Promise.all(
        batch.map(url => scraper(url).catch(error => ({
          data: null,
          metadata: {
            url,
            scrapedAt: new Date(),
            method: 'static' as const,
            responseTime: 0,
            retries: 0,
            error: error.message
          }
        })))
      );

      results.push(...batchResults);
      completed += batchResults.length;

      if (options.onProgress) {
        options.onProgress(completed, urls.length);
      }
    }

    return results;
  }

  /**
   * Login to a website and maintain session
   */
  async login(loginUrl: string, credentials: {
    username: string;
    password: string;
    usernameField?: string;
    passwordField?: string;
    submitSelector?: string;
  }): Promise<boolean> {
    if (!this.session) {
      this.session = requests.Session();
    }

    // Get login page to extract CSRF tokens, etc.
    const response = this.session.get(loginUrl);
    const soup = new bs4.BeautifulSoup(response.text, 'html.parser');

    // Find login form
    const form = soup.find('form');
    const formData: any = {};

    // Extract hidden fields (CSRF tokens, etc.)
    const hiddenInputs = form.find_all('input', { type: 'hidden' });
    for (const input of hiddenInputs) {
      formData[input.get('name')] = input.get('value');
    }

    // Add credentials
    formData[credentials.usernameField || 'username'] = credentials.username;
    formData[credentials.passwordField || 'password'] = credentials.password;

    // Get form action URL
    const action = form.get('action');
    const submitUrl = action ? urllib.parse.urljoin(loginUrl, action) : loginUrl;

    // Submit login form
    const loginResponse = this.session.post(submitUrl, { data: formData });

    // Check if login was successful (status code 200-399 and not on login page)
    const success = loginResponse.status_code < 400 &&
                   !loginResponse.url.includes('login');

    if (success && this.config.persistCookies) {
      this.saveCookies();
    }

    return success;
  }

  /**
   * Extract structured data from HTML
   */
  extractStructured(soup: any, schema: Record<string, string | {
    selector: string;
    attribute?: string;
    transform?: (value: string) => any;
    multiple?: boolean;
  }>): any {
    const result: any = {};

    for (const [key, config] of Object.entries(schema)) {
      try {
        if (typeof config === 'string') {
          // Simple selector
          const element = soup.select_one(config);
          result[key] = element ? element.text.strip() : null;
        } else {
          // Advanced configuration
          if (config.multiple) {
            const elements = soup.select(config.selector);
            result[key] = elements.map((el: any) => {
              let value = config.attribute ? el.get(config.attribute) : el.text.strip();
              return config.transform ? config.transform(value) : value;
            });
          } else {
            const element = soup.select_one(config.selector);
            if (element) {
              let value = config.attribute ? element.get(config.attribute) : element.text.strip();
              result[key] = config.transform ? config.transform(value) : value;
            } else {
              result[key] = null;
            }
          }
        }
      } catch (error) {
        result[key] = null;
      }
    }

    return result;
  }

  /**
   * Validate scraped data
   */
  validate(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.validate) {
      return { valid: true, errors };
    }

    // Check required fields
    if (this.config.validate.required) {
      for (const field of this.config.validate.required) {
        if (!(field in data) || data[field] === null || data[field] === undefined) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Check types
    if (this.config.validate.types) {
      for (const [field, expectedType] of Object.entries(this.config.validate.types)) {
        if (field in data) {
          const actualType = typeof data[field];
          if (actualType !== expectedType) {
            errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`);
          }
        }
      }
    }

    // Check patterns
    if (this.config.validate.patterns) {
      for (const [field, pattern] of Object.entries(this.config.validate.patterns)) {
        if (field in data && typeof data[field] === 'string') {
          if (!pattern.test(data[field])) {
            errors.push(`Invalid format for ${field}: does not match pattern`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Convert BeautifulSoup element to plain object
   */
  private elementToObject(element: any): any {
    return {
      tag: element.name,
      text: element.text?.strip(),
      html: String(element),
      attrs: element.attrs || {},
      children: element.children ? Array.from(element.children).map((child: any) => {
        if (typeof child === 'string') {
          return child.strip();
        }
        return this.elementToObject(child);
      }) : []
    };
  }

  /**
   * Get headers for request
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.getUserAgent(),
      ...this.config.headers
    };

    return headers;
  }

  /**
   * Get user agent (with rotation if enabled)
   */
  private getUserAgent(): string {
    if (this.config.rotateUserAgents) {
      const userAgent = this.userAgents[this.currentUserAgentIndex];
      this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
      return userAgent;
    }

    return this.config.userAgent || this.userAgents[0];
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(): Promise<void> {
    if (!this.config.rateLimit) return;

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.config.rateLimit) {
      const delay = this.config.rateLimit - timeSinceLastRequest;
      await this.sleep(delay);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = this.config.retryDelay || 1000;

    switch (this.config.backoff) {
      case 'linear':
        return baseDelay * attempt;
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      case 'fibonacci':
        return baseDelay * this.fibonacci(attempt);
      default:
        return baseDelay;
    }
  }

  /**
   * Fibonacci sequence for backoff
   */
  private fibonacci(n: number): number {
    if (n <= 1) return 1;
    let a = 1, b = 1;
    for (let i = 2; i < n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  }

  /**
   * Sleep utility
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get Selenium browser options
   */
  private getSeleniumOptions(browser: string, headless: boolean): any {
    if (browser === 'firefox') {
      const options = new selenium.webdriver.firefox.options.Options();
      if (headless) {
        options.add_argument('--headless');
      }
      return { options };
    } else {
      const options = new selenium.webdriver.chrome.options.Options();
      if (headless) {
        options.add_argument('--headless');
        options.add_argument('--disable-gpu');
      }
      options.add_argument('--no-sandbox');
      options.add_argument('--disable-dev-shm-usage');
      return { options };
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    if (!this.config.cache?.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const ttl = this.config.cache.ttl || 3600;
    const age = (Date.now() - cached.timestamp) / 1000;

    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    if (!this.config.cache?.enabled) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Cookie persistence
   */
  private loadCookies(): void {
    // Implementation would load cookies from file
    // Using Python's pickle or json
  }

  private saveCookies(): void {
    // Implementation would save cookies to file
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.session) {
      this.session.close();
      this.session = null;
    }

    this.cache.clear();
  }
}

/**
 * Utility functions for common scraping tasks
 */
export class ScraperUtils {
  /**
   * Extract all links from HTML
   */
  static extractLinks(soup: any, baseUrl?: string): string[] {
    const links = soup.find_all('a');
    const urls = links.map((link: any) => link.get('href')).filter((href: any) => href);

    if (baseUrl) {
      return urls.map((url: string) => urllib.parse.urljoin(baseUrl, url));
    }

    return urls;
  }

  /**
   * Extract all images from HTML
   */
  static extractImages(soup: any, baseUrl?: string): Array<{ src: string; alt?: string }> {
    const images = soup.find_all('img');

    return images.map((img: any) => {
      let src = img.get('src');
      if (baseUrl && src) {
        src = urllib.parse.urljoin(baseUrl, src);
      }

      return {
        src,
        alt: img.get('alt')
      };
    });
  }

  /**
   * Extract table data
   */
  static extractTable(soup: any, tableSelector: string): any[][] {
    const table = soup.select_one(tableSelector);
    if (!table) return [];

    const rows = table.find_all('tr');
    return rows.map((row: any) => {
      const cells = row.find_all(['td', 'th']);
      return cells.map((cell: any) => cell.text.strip());
    });
  }

  /**
   * Clean text (remove extra whitespace, normalize)
   */
  static cleanText(text: string): string {
    // Use Python's regex for cleaning
    let cleaned = re.sub(r'\s+', ' ', text);
    cleaned = cleaned.strip();
    return cleaned;
  }

  /**
   * Extract meta tags
   */
  static extractMeta(soup: any): Record<string, string> {
    const meta: Record<string, string> = {};
    const metaTags = soup.find_all('meta');

    for (const tag of metaTags) {
      const name = tag.get('name') || tag.get('property');
      const content = tag.get('content');

      if (name && content) {
        meta[name] = content;
      }
    }

    return meta;
  }

  /**
   * Parse URL
   */
  static parseUrl(url: string): {
    scheme: string;
    netloc: string;
    path: string;
    params: string;
    query: Record<string, string>;
    fragment: string;
  } {
    const parsed = urllib.parse.urlparse(url);
    const queryParams = urllib.parse.parse_qs(parsed.query);

    return {
      scheme: parsed.scheme,
      netloc: parsed.netloc,
      path: parsed.path,
      params: parsed.params,
      query: queryParams,
      fragment: parsed.fragment
    };
  }

  /**
   * Build URL with query parameters
   */
  static buildUrl(base: string, params: Record<string, string>): string {
    const parsed = urllib.parse.urlparse(base);
    const query = urllib.parse.urlencode(params);

    return urllib.parse.urlunparse([
      parsed.scheme,
      parsed.netloc,
      parsed.path,
      parsed.params,
      query,
      parsed.fragment
    ]);
  }
}

/**
 * Export main scraper instance factory
 */
export function createScraper(config?: ScraperConfig): PolygotScraper {
  return new PolygotScraper(config);
}

export default PolygotScraper;
