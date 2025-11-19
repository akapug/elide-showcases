/**
 * Selenium WebDriver - Browser Automation in TypeScript
 *
 * Demonstrates Elide polyglot by wrapping Python's Selenium WebDriver
 * for browser automation and dynamic content scraping in TypeScript.
 */

// @ts-ignore - Elide polyglot import: Selenium WebDriver
import selenium from 'python:selenium';

// @ts-ignore - Elide polyglot import: Selenium webdriver
import { webdriver } from 'python:selenium';

// @ts-ignore - Elide polyglot import: Selenium common
import { common } from 'python:selenium.webdriver';

// @ts-ignore - Elide polyglot import: Selenium support
import { support } from 'python:selenium.webdriver';

// @ts-ignore - Elide polyglot import: time for waits
import time from 'python:time';

/**
 * Browser types supported
 */
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge';

/**
 * Selenium driver configuration
 */
export interface SeleniumConfig {
  /** Browser type */
  browser?: BrowserType;

  /** Run browser in headless mode */
  headless?: boolean;

  /** Implicit wait timeout (seconds) */
  implicitWait?: number;

  /** Page load timeout (seconds) */
  pageLoadTimeout?: number;

  /** Script execution timeout (seconds) */
  scriptTimeout?: number;

  /** Window size */
  windowSize?: {
    width: number;
    height: number;
  };

  /** User agent string */
  userAgent?: string;

  /** Proxy configuration */
  proxy?: {
    http?: string;
    https?: string;
    socks?: string;
  };

  /** Additional browser arguments */
  arguments?: string[];

  /** Browser binary path (custom browser location) */
  binaryPath?: string;

  /** WebDriver path (custom driver location) */
  driverPath?: string;

  /** Enable logging */
  logging?: boolean;

  /** Accept insecure certificates */
  acceptInsecureCerts?: boolean;
}

/**
 * Element locator strategies
 */
export type LocatorStrategy =
  | 'id'
  | 'name'
  | 'className'
  | 'tagName'
  | 'cssSelector'
  | 'xpath'
  | 'linkText'
  | 'partialLinkText';

/**
 * Web element interface
 */
export interface WebElement {
  /** Get element text */
  text: string;

  /** Get element tag name */
  tagName: string;

  /** Get element attributes */
  getAttribute(name: string): string | null;

  /** Click element */
  click(): Promise<void>;

  /** Send keys to element */
  sendKeys(text: string): Promise<void>;

  /** Clear element (for input fields) */
  clear(): Promise<void>;

  /** Check if element is displayed */
  isDisplayed(): Promise<boolean>;

  /** Check if element is enabled */
  isEnabled(): Promise<boolean>;

  /** Check if element is selected (checkboxes/radio) */
  isSelected(): Promise<boolean>;
}

/**
 * Selenium WebDriver wrapper class
 */
export class SeleniumDriver {
  private driver: any;
  private config: SeleniumConfig;

  /**
   * Initialize Selenium WebDriver
   */
  constructor(config: SeleniumConfig = {}) {
    this.config = {
      browser: 'chrome',
      headless: false,
      implicitWait: 10,
      pageLoadTimeout: 30,
      scriptTimeout: 30,
      ...config
    };

    this.driver = this.initializeDriver();
    this.configureDriver();
  }

  /**
   * Initialize the appropriate WebDriver
   */
  private initializeDriver(): any {
    const browserOptions = this.getBrowserOptions();

    switch (this.config.browser) {
      case 'firefox':
        return new webdriver.Firefox(browserOptions);

      case 'safari':
        return new webdriver.Safari(browserOptions);

      case 'edge':
        return new webdriver.Edge(browserOptions);

      case 'chrome':
      default:
        return new webdriver.Chrome(browserOptions);
    }
  }

  /**
   * Get browser-specific options
   */
  private getBrowserOptions(): any {
    const options: any = {};

    if (this.config.browser === 'chrome') {
      const chromeOptions = new webdriver.chrome.options.Options();

      if (this.config.headless) {
        chromeOptions.add_argument('--headless');
        chromeOptions.add_argument('--disable-gpu');
      }

      chromeOptions.add_argument('--no-sandbox');
      chromeOptions.add_argument('--disable-dev-shm-usage');

      if (this.config.userAgent) {
        chromeOptions.add_argument(`user-agent=${this.config.userAgent}`);
      }

      if (this.config.windowSize) {
        chromeOptions.add_argument(
          `--window-size=${this.config.windowSize.width},${this.config.windowSize.height}`
        );
      }

      if (this.config.arguments) {
        for (const arg of this.config.arguments) {
          chromeOptions.add_argument(arg);
        }
      }

      if (this.config.binaryPath) {
        chromeOptions.binary_location = this.config.binaryPath;
      }

      options.options = chromeOptions;

    } else if (this.config.browser === 'firefox') {
      const firefoxOptions = new webdriver.firefox.options.Options();

      if (this.config.headless) {
        firefoxOptions.add_argument('--headless');
      }

      if (this.config.userAgent) {
        firefoxOptions.set_preference('general.useragent.override', this.config.userAgent);
      }

      if (this.config.arguments) {
        for (const arg of this.config.arguments) {
          firefoxOptions.add_argument(arg);
        }
      }

      if (this.config.binaryPath) {
        firefoxOptions.binary_location = this.config.binaryPath;
      }

      options.options = firefoxOptions;
    }

    if (this.config.acceptInsecureCerts) {
      options.desired_capabilities = {
        acceptInsecureCerts: true
      };
    }

    return options;
  }

  /**
   * Configure driver timeouts and settings
   */
  private configureDriver(): void {
    // Set timeouts
    if (this.config.implicitWait) {
      this.driver.implicitly_wait(this.config.implicitWait);
    }

    if (this.config.pageLoadTimeout) {
      this.driver.set_page_load_timeout(this.config.pageLoadTimeout);
    }

    if (this.config.scriptTimeout) {
      this.driver.set_script_timeout(this.config.scriptTimeout);
    }

    // Set window size if specified
    if (this.config.windowSize && !this.config.headless) {
      this.driver.set_window_size(
        this.config.windowSize.width,
        this.config.windowSize.height
      );
    }
  }

  /**
   * Navigate to URL
   */
  async navigate(url: string): Promise<void> {
    await this.driver.get(url);
  }

  /**
   * Get current URL
   */
  async getCurrentURL(): Promise<string> {
    return await this.driver.current_url;
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.driver.title;
  }

  /**
   * Get page source HTML
   */
  async getPageSource(): Promise<string> {
    return await this.driver.page_source;
  }

  /**
   * Find element by locator
   */
  async findElement(strategy: LocatorStrategy, value: string): Promise<any> {
    const By = common.by.By;

    let locator;
    switch (strategy) {
      case 'id':
        locator = By.ID;
        break;
      case 'name':
        locator = By.NAME;
        break;
      case 'className':
        locator = By.CLASS_NAME;
        break;
      case 'tagName':
        locator = By.TAG_NAME;
        break;
      case 'cssSelector':
        locator = By.CSS_SELECTOR;
        break;
      case 'xpath':
        locator = By.XPATH;
        break;
      case 'linkText':
        locator = By.LINK_TEXT;
        break;
      case 'partialLinkText':
        locator = By.PARTIAL_LINK_TEXT;
        break;
      default:
        locator = By.CSS_SELECTOR;
    }

    return await this.driver.find_element(locator, value);
  }

  /**
   * Find multiple elements
   */
  async findElements(strategy: LocatorStrategy, value: string): Promise<any[]> {
    const By = common.by.By;
    let locator;

    switch (strategy) {
      case 'id':
        locator = By.ID;
        break;
      case 'name':
        locator = By.NAME;
        break;
      case 'className':
        locator = By.CLASS_NAME;
        break;
      case 'tagName':
        locator = By.TAG_NAME;
        break;
      case 'cssSelector':
        locator = By.CSS_SELECTOR;
        break;
      case 'xpath':
        locator = By.XPATH;
        break;
      case 'linkText':
        locator = By.LINK_TEXT;
        break;
      case 'partialLinkText':
        locator = By.PARTIAL_LINK_TEXT;
        break;
      default:
        locator = By.CSS_SELECTOR;
    }

    return await this.driver.find_elements(locator, value);
  }

  /**
   * Wait for element to be present
   */
  async waitForElement(
    strategy: LocatorStrategy,
    value: string,
    timeout: number = 10
  ): Promise<any> {
    const By = common.by.By;
    const until = support.ui.until;

    let locator;
    switch (strategy) {
      case 'cssSelector':
        locator = By.CSS_SELECTOR;
        break;
      case 'xpath':
        locator = By.XPATH;
        break;
      case 'id':
        locator = By.ID;
        break;
      default:
        locator = By.CSS_SELECTOR;
    }

    const wait = new support.ui.WebDriverWait(this.driver, timeout);
    return await wait.until(until.element_located(locator, value));
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(
    strategy: LocatorStrategy,
    value: string,
    timeout: number = 10
  ): Promise<any> {
    const element = await this.waitForElement(strategy, value, timeout);
    const until = support.ui.until;
    const wait = new support.ui.WebDriverWait(this.driver, timeout);
    return await wait.until(until.element_to_be_visible(element));
  }

  /**
   * Wait for element to be clickable
   */
  async waitForClickable(
    strategy: LocatorStrategy,
    value: string,
    timeout: number = 10
  ): Promise<any> {
    const element = await this.waitForElement(strategy, value, timeout);
    const until = support.ui.until;
    const wait = new support.ui.WebDriverWait(this.driver, timeout);
    return await wait.until(until.element_to_be_clickable(element));
  }

  /**
   * Click element
   */
  async click(strategy: LocatorStrategy, value: string): Promise<void> {
    const element = await this.findElement(strategy, value);
    await element.click();
  }

  /**
   * Type text into element
   */
  async type(strategy: LocatorStrategy, value: string, text: string): Promise<void> {
    const element = await this.findElement(strategy, value);
    await element.send_keys(text);
  }

  /**
   * Clear input field
   */
  async clear(strategy: LocatorStrategy, value: string): Promise<void> {
    const element = await this.findElement(strategy, value);
    await element.clear();
  }

  /**
   * Fill form fields
   */
  async fillForm(fields: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(fields)) {
      try {
        await this.clear('cssSelector', selector);
        await this.type('cssSelector', selector, value);
      } catch (error) {
        console.error(`Failed to fill field ${selector}:`, error);
      }
    }
  }

  /**
   * Submit form
   */
  async submitForm(formSelector: string): Promise<void> {
    const form = await this.findElement('cssSelector', formSelector);
    await form.submit();
  }

  /**
   * Execute JavaScript
   */
  async executeScript(script: string, ...args: any[]): Promise<any> {
    return await this.driver.execute_script(script, ...args);
  }

  /**
   * Execute async JavaScript
   */
  async executeAsyncScript(script: string, ...args: any[]): Promise<any> {
    return await this.driver.execute_async_script(script, ...args);
  }

  /**
   * Scroll to element
   */
  async scrollToElement(strategy: LocatorStrategy, value: string): Promise<void> {
    const element = await this.findElement(strategy, value);
    await this.driver.execute_script('arguments[0].scrollIntoView(true);', element);
  }

  /**
   * Scroll to position
   */
  async scrollTo(x: number, y: number): Promise<void> {
    await this.driver.execute_script(`window.scrollTo(${x}, ${y});`);
  }

  /**
   * Take screenshot
   */
  async screenshot(filepath: string): Promise<void> {
    await this.driver.save_screenshot(filepath);
  }

  /**
   * Take element screenshot
   */
  async screenshotElement(strategy: LocatorStrategy, value: string, filepath: string): Promise<void> {
    const element = await this.findElement(strategy, value);
    await element.screenshot(filepath);
  }

  /**
   * Get cookies
   */
  async getCookies(): Promise<any[]> {
    return await this.driver.get_cookies();
  }

  /**
   * Get cookie by name
   */
  async getCookie(name: string): Promise<any> {
    return await this.driver.get_cookie(name);
  }

  /**
   * Add cookie
   */
  async addCookie(cookie: {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expiry?: number;
  }): Promise<void> {
    await this.driver.add_cookie(cookie);
  }

  /**
   * Delete cookie
   */
  async deleteCookie(name: string): Promise<void> {
    await this.driver.delete_cookie(name);
  }

  /**
   * Delete all cookies
   */
  async deleteAllCookies(): Promise<void> {
    await this.driver.delete_all_cookies();
  }

  /**
   * Switch to frame
   */
  async switchToFrame(frameReference: string | number): Promise<void> {
    if (typeof frameReference === 'number') {
      await this.driver.switch_to.frame(frameReference);
    } else {
      const frame = await this.findElement('cssSelector', frameReference);
      await this.driver.switch_to.frame(frame);
    }
  }

  /**
   * Switch to default content
   */
  async switchToDefaultContent(): Promise<void> {
    await this.driver.switch_to.default_content();
  }

  /**
   * Switch to window
   */
  async switchToWindow(windowHandle: string): Promise<void> {
    await this.driver.switch_to.window(windowHandle);
  }

  /**
   * Get window handles
   */
  async getWindowHandles(): Promise<string[]> {
    return await this.driver.window_handles;
  }

  /**
   * Get current window handle
   */
  async getCurrentWindowHandle(): Promise<string> {
    return await this.driver.current_window_handle;
  }

  /**
   * Open new tab
   */
  async openNewTab(url?: string): Promise<void> {
    await this.driver.execute_script('window.open();');

    const handles = await this.getWindowHandles();
    await this.switchToWindow(handles[handles.length - 1]);

    if (url) {
      await this.navigate(url);
    }
  }

  /**
   * Close current tab
   */
  async closeTab(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Go back in history
   */
  async goBack(): Promise<void> {
    await this.driver.back();
  }

  /**
   * Go forward in history
   */
  async goForward(): Promise<void> {
    await this.driver.forward();
  }

  /**
   * Refresh page
   */
  async refresh(): Promise<void> {
    await this.driver.refresh();
  }

  /**
   * Accept alert
   */
  async acceptAlert(): Promise<void> {
    const alert = await this.driver.switch_to.alert;
    await alert.accept();
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(): Promise<void> {
    const alert = await this.driver.switch_to.alert;
    await alert.dismiss();
  }

  /**
   * Get alert text
   */
  async getAlertText(): Promise<string> {
    const alert = await this.driver.switch_to.alert;
    return await alert.text;
  }

  /**
   * Send text to alert
   */
  async sendAlertText(text: string): Promise<void> {
    const alert = await this.driver.switch_to.alert;
    await alert.send_keys(text);
  }

  /**
   * Extract data from multiple elements
   */
  async extractData(
    containerSelector: string,
    schema: Record<string, string>
  ): Promise<any[]> {
    const containers = await this.findElements('cssSelector', containerSelector);
    const results: any[] = [];

    for (const container of containers) {
      const item: any = {};

      for (const [key, selector] of Object.entries(schema)) {
        try {
          const element = await container.find_element(
            common.by.By.CSS_SELECTOR,
            selector
          );
          item[key] = await element.text;
        } catch {
          item[key] = null;
        }
      }

      results.push(item);
    }

    return results;
  }

  /**
   * Wait for page load
   */
  async waitForPageLoad(timeout: number = 30): Promise<void> {
    const script = 'return document.readyState';
    const endTime = Date.now() + timeout * 1000;

    while (Date.now() < endTime) {
      const state = await this.executeScript(script);
      if (state === 'complete') {
        return;
      }
      await this.sleep(100);
    }

    throw new Error('Page load timeout');
  }

  /**
   * Wait for ajax to complete
   */
  async waitForAjax(timeout: number = 30): Promise<void> {
    const script = 'return jQuery.active === 0';
    const endTime = Date.now() + timeout * 1000;

    while (Date.now() < endTime) {
      try {
        const complete = await this.executeScript(script);
        if (complete) {
          return;
        }
      } catch {
        // jQuery not available
        return;
      }
      await this.sleep(100);
    }
  }

  /**
   * Hover over element
   */
  async hover(strategy: LocatorStrategy, value: string): Promise<void> {
    const element = await this.findElement(strategy, value);
    const actions = new common.action_chains.ActionChains(this.driver);
    await actions.move_to_element(element).perform();
  }

  /**
   * Drag and drop
   */
  async dragAndDrop(
    sourceStrategy: LocatorStrategy,
    sourceValue: string,
    targetStrategy: LocatorStrategy,
    targetValue: string
  ): Promise<void> {
    const source = await this.findElement(sourceStrategy, sourceValue);
    const target = await this.findElement(targetStrategy, targetValue);
    const actions = new common.action_chains.ActionChains(this.driver);
    await actions.drag_and_drop(source, target).perform();
  }

  /**
   * Select dropdown option by visible text
   */
  async selectByText(strategy: LocatorStrategy, value: string, text: string): Promise<void> {
    const element = await this.findElement(strategy, value);
    const select = new support.select.Select(element);
    await select.select_by_visible_text(text);
  }

  /**
   * Select dropdown option by value
   */
  async selectByValue(strategy: LocatorStrategy, value: string, optionValue: string): Promise<void> {
    const element = await this.findElement(strategy, value);
    const select = new support.select.Select(element);
    await select.select_by_value(optionValue);
  }

  /**
   * Select dropdown option by index
   */
  async selectByIndex(strategy: LocatorStrategy, value: string, index: number): Promise<void> {
    const element = await this.findElement(strategy, value);
    const select = new support.select.Select(element);
    await select.select_by_index(index);
  }

  /**
   * Sleep/wait
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Quit driver and close browser
   */
  async quit(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  /**
   * Get raw Selenium driver (for advanced usage)
   */
  getRawDriver(): any {
    return this.driver;
  }
}

/**
 * Factory function
 */
export function createSeleniumDriver(config?: SeleniumConfig): SeleniumDriver {
  return new SeleniumDriver(config);
}

export default SeleniumDriver;
