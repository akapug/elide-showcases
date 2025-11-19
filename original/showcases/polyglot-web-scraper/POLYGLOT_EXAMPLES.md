# Polyglot Code Examples - Python in TypeScript

This document showcases the most impressive polyglot code examples from the showcase, demonstrating how Python's powerful libraries integrate seamlessly into TypeScript.

## Example 1: BeautifulSoup4 HTML Parsing

**From:** `src/scraper.ts` and `src/parsers/html-parser.ts`

### The Polyglot Magic

```typescript
// @ts-ignore - Elide polyglot import: Python's BeautifulSoup4
import bs4 from 'python:bs4';

// @ts-ignore - Elide polyglot import: Python's requests
import requests from 'python:requests';

/**
 * Scrape static HTML content - Python libraries in TypeScript!
 */
async scrapeStatic(url: string): Promise<ScrapedData> {
  // Make HTTP request using Python's requests library
  const response = requests.get(url, {
    headers: this.getHeaders(),
    timeout: this.config.timeout / 1000,
    proxies: this.config.proxies
  });

  // Check HTTP status
  if (response.status_code >= 400) {
    throw new Error(`HTTP ${response.status_code}: ${response.reason}`);
  }

  // Parse HTML with Python's BeautifulSoup4
  const soup = new bs4.BeautifulSoup(response.text, 'html.parser');

  // Extract data using CSS selectors
  const elements = soup.select('.product-card');

  // Map to TypeScript objects
  const data = elements.map((el: any) => ({
    tag: el.name,
    text: el.text?.strip(),
    html: String(el),
    attrs: el.attrs || {}
  }));

  return { data, metadata };
}
```

### Advanced BeautifulSoup Features

```typescript
export class HTMLParser {
  private soup: any;

  constructor(html: string) {
    // Create BeautifulSoup parser in TypeScript
    this.soup = new bs4.BeautifulSoup(html, 'html.parser');
  }

  /**
   * CSS selectors - Python's powerful parsing in TypeScript
   */
  select(cssSelector: string): HTMLElement[] {
    const elements = this.soup.select(cssSelector);
    return elements.map((el: any) => this.toElement(el));
  }

  /**
   * Extract structured data using Python's BeautifulSoup
   */
  extractStructured(schema: Record<string, string>): any {
    const result: any = {};

    for (const [key, selector] of Object.entries(schema)) {
      const element = this.soup.select_one(selector);
      result[key] = element ? element.text?.strip() : null;
    }

    return result;
  }

  /**
   * Extract table data - BeautifulSoup makes it easy
   */
  extractTable(tableSelector?: string): { headers: string[]; rows: string[][] } {
    const table = tableSelector
      ? this.soup.select_one(tableSelector)
      : this.soup.find('table');

    if (!table) {
      return { headers: [], rows: [] };
    }

    // Extract headers
    const headerRow = table.find('thead')?.find('tr') || table.find('tr');
    const headers = headerRow
      .find_all('th')
      .map((cell: any) => cell.text?.strip() || '');

    // Extract rows
    const tbody = table.find('tbody') || table;
    const rows = tbody.find_all('tr').map((row: any) =>
      row.find_all(['td', 'th']).map((cell: any) => cell.text?.strip() || '')
    );

    return { headers, rows };
  }
}
```

## Example 2: Selenium WebDriver for Browser Automation

**From:** `src/browsers/selenium-driver.ts`

### Initialize Selenium in TypeScript

```typescript
// @ts-ignore - Elide polyglot import: Selenium WebDriver
import selenium from 'python:selenium';
// @ts-ignore
import { webdriver } from 'python:selenium';
// @ts-ignore
import { common } from 'python:selenium.webdriver';
// @ts-ignore
import { support } from 'python:selenium.webdriver';

export class SeleniumDriver {
  private driver: any;

  constructor(config: SeleniumConfig = {}) {
    // Create Chrome options using Python's Selenium
    const chromeOptions = new webdriver.chrome.options.Options();

    if (config.headless) {
      chromeOptions.add_argument('--headless');
      chromeOptions.add_argument('--disable-gpu');
    }

    chromeOptions.add_argument('--no-sandbox');
    chromeOptions.add_argument('--disable-dev-shm-usage');

    if (config.userAgent) {
      chromeOptions.add_argument(`user-agent=${config.userAgent}`);
    }

    // Initialize Chrome WebDriver
    this.driver = new webdriver.Chrome({ options: chromeOptions });

    // Set timeouts
    this.driver.implicitly_wait(config.implicitWait || 10);
    this.driver.set_page_load_timeout(config.pageLoadTimeout || 30);
  }

  /**
   * Navigate to URL
   */
  async navigate(url: string): Promise<void> {
    await this.driver.get(url);
  }

  /**
   * Wait for element with TypeScript async/await
   */
  async waitForElement(
    strategy: LocatorStrategy,
    value: string,
    timeout: number = 10
  ): Promise<any> {
    const By = common.by.By;
    const until = support.ui.until;

    const wait = new support.ui.WebDriverWait(this.driver, timeout);
    return await wait.until(
      until.element_located(By.CSS_SELECTOR, value)
    );
  }

  /**
   * Execute JavaScript in the browser
   */
  async executeScript(script: string, ...args: any[]): Promise<any> {
    return await this.driver.execute_script(script, ...args);
  }

  /**
   * Extract data from multiple elements
   */
  async extractData(
    containerSelector: string,
    schema: Record<string, string>
  ): Promise<any[]> {
    const containers = await this.driver.find_elements(
      common.by.By.CSS_SELECTOR,
      containerSelector
    );

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
}
```

## Example 3: Pandas Data Processing

**From:** `src/data/pandas-processor.ts`

### Create DataFrame and Process Data

```typescript
// @ts-ignore - Elide polyglot import: pandas
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';

export class PandasProcessor {
  private df: any;

  constructor(data: any[] | Record<string, any[]>) {
    // Create pandas DataFrame from TypeScript data
    this.df = pandas.DataFrame(data);
  }

  /**
   * Method chaining with pandas in TypeScript
   */
  processData(): PandasProcessor {
    // Drop null values
    this.df = this.df.dropna({ how: 'any' });

    // Drop duplicates
    this.df = this.df.drop_duplicates();

    // Sort by column
    this.df = this.df.sort_values('price', { ascending: false });

    // Fill missing values with mean
    this.df = this.df.fillna(this.df.mean());

    return this;
  }

  /**
   * Group by and aggregate
   */
  groupBy(columns: string | string[]): GroupedData {
    const grouped = this.df.groupby(
      Array.isArray(columns) ? columns : [columns]
    );
    return new GroupedData(grouped);
  }

  /**
   * Aggregate with multiple functions
   */
  aggregate(aggregations: Record<string, AggFunction | AggFunction[]>): Record<string, any> {
    const result = this.df.agg(aggregations);
    return result.to_dict();
  }

  /**
   * Filter data using query string
   */
  query(queryString: string): PandasProcessor {
    this.df = this.df.query(queryString);
    return this;
  }

  /**
   * Export to multiple formats
   */
  export(format: 'csv' | 'json' | 'excel', filepath: string): void {
    switch (format) {
      case 'csv':
        this.df.to_csv(filepath, { index: false });
        break;
      case 'json':
        this.df.to_json(filepath, { orient: 'records' });
        break;
      case 'excel':
        this.df.to_excel(filepath, { index: false });
        break;
    }
  }
}

/**
 * Example usage - complete data pipeline
 */
async function dataAnalysisPipeline() {
  // 1. Scrape data with Python's requests + BeautifulSoup
  const response = requests.get('https://api.example.com/products');
  const soup = new bs4.BeautifulSoup(response.text, 'html.parser');

  const products = soup.select('.product').map((el: any) => ({
    name: el.find('.name').text,
    price: parseFloat(el.find('.price').text.replace('$', '')),
    rating: parseFloat(el.find('.rating').text)
  }));

  // 2. Process with Python's pandas in TypeScript
  const processor = new PandasProcessor(products);

  processor
    .dropNA()
    .dropDuplicates()
    .query('price > 50 and rating >= 4.0')
    .sort('rating', { ascending: false });

  // 3. Aggregate statistics
  const stats = processor.aggregate({
    price: ['mean', 'min', 'max'],
    rating: 'mean'
  });

  console.log('Statistics:', stats);

  // 4. Export to CSV
  processor.toCSV('products.csv');
}
```

## Example 4: lxml for XML Parsing

**From:** `src/parsers/xml-parser.ts`

### XPath Queries in TypeScript

```typescript
// @ts-ignore - Elide polyglot import: lxml
import lxml from 'python:lxml';
// @ts-ignore
import { etree } from 'python:lxml';

export class XMLParser {
  private tree: any;
  private root: any;

  constructor(xml: string) {
    // Create XML parser
    const parser = etree.XMLParser({
      remove_blank_text: true,
      remove_comments: true
    });

    // Parse XML
    this.tree = etree.fromstring(xml, parser);
    this.root = this.tree;
  }

  /**
   * XPath query - lxml's most powerful feature
   */
  xpath(query: string, namespaces?: NamespaceMap): XMLElement[] {
    const results = namespaces
      ? this.root.xpath(query, { namespaces })
      : this.root.xpath(query);

    return Array.isArray(results)
      ? results.map((el: any) => this.toElement(el))
      : [this.toElement(results)];
  }

  /**
   * Extract structured data with XPath
   */
  extractStructured(schema: Record<string, string | {
    xpath: string;
    attribute?: string;
    transform?: (value: string) => any;
  }>): any {
    const result: any = {};

    for (const [key, config] of Object.entries(schema)) {
      if (typeof config === 'string') {
        // Simple XPath
        const values = this.xpathText(config);
        result[key] = values[0] || null;
      } else {
        // Advanced XPath with attribute extraction
        if (config.attribute) {
          const elements = this.xpath(config.xpath);
          const values = elements.map(el => el.attributes[config.attribute!]);
          result[key] = config.transform
            ? values.map(config.transform)
            : values;
        } else {
          const values = this.xpathText(config.xpath);
          result[key] = config.transform
            ? values.map(config.transform)
            : values;
        }
      }
    }

    return result;
  }
}

/**
 * Example: Parse RSS feed with lxml in TypeScript
 */
async function parseRSSFeed(url: string) {
  // Fetch RSS feed
  const response = requests.get(url);

  // Parse with lxml
  const parser = new XMLParser(response.text);

  // Extract articles using XPath
  const articles = parser.extractStructured({
    title: '//item/title/text()',
    link: '//item/link/text()',
    pubDate: {
      xpath: '//item/pubDate/text()',
      transform: (date: string) => new Date(date)
    },
    description: '//item/description/text()'
  });

  console.log('Articles:', articles);
}
```

## Example 5: Newspaper3k for Article Extraction

**From:** `examples/news-aggregator.ts`

### Complete Article Extraction Pipeline

```typescript
// @ts-ignore - Elide polyglot import: newspaper3k
import newspaper from 'python:newspaper';

export class NewsAggregator {
  /**
   * Build newspaper source and extract articles
   */
  async fetchArticles(sourceUrl: string): Promise<Article[]> {
    // Build newspaper source - Python's newspaper3k in TypeScript!
    const paper = newspaper.build(sourceUrl, {
      language: 'en',
      memoize_articles: false,
      fetch_images: true
    });

    const articles: Article[] = [];

    // Iterate through articles
    for (const article of paper.articles.slice(0, 50)) {
      // Download article HTML
      article.download();

      // Parse article content
      article.parse();

      // Apply NLP (keywords, summary)
      article.nlp();

      // Create structured article object
      articles.push({
        title: article.title || '',
        url: article.url || '',
        authors: Array.from(article.authors || []),
        publishDate: article.publish_date
          ? new Date(article.publish_date)
          : undefined,
        text: article.text || '',
        summary: article.summary || '',
        keywords: Array.from(article.keywords || []),
        images: Array.from(article.images || []),
        videos: Array.from(article.movies || []),
        language: article.meta_lang || 'en',
        scrapedAt: new Date()
      });
    }

    return articles;
  }

  /**
   * Extract single article with full NLP
   */
  async extractArticle(url: string): Promise<Article> {
    // Create Article object
    const article = newspaper.Article(url);

    // Download HTML
    article.download();

    // Parse content
    article.parse();

    // Apply NLP processing
    article.nlp();

    return {
      title: article.title,
      url: article.url,
      authors: Array.from(article.authors),
      publishDate: article.publish_date
        ? new Date(article.publish_date)
        : undefined,
      text: article.text,
      summary: article.summary,
      keywords: Array.from(article.keywords),
      images: Array.from(article.top_image ? [article.top_image] : []),
      scrapedAt: new Date()
    };
  }
}
```

## Example 6: Complete E-commerce Scraper

**From:** `examples/ecommerce-scraper.ts`

### Full Scraping Pipeline

```typescript
export class EcommerceScraper {
  /**
   * Scrape products combining multiple Python libraries
   */
  async scrapeProducts(): Promise<Product[]> {
    const products: Product[] = [];

    for (let page = 1; page <= 5; page++) {
      const url = `https://shop.example.com/products?page=${page}`;

      // 1. Fetch page with Python's requests
      const response = requests.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0...' },
        timeout: 30
      });

      // 2. Parse HTML with BeautifulSoup4
      const soup = new bs4.BeautifulSoup(response.text, 'html.parser');

      // 3. Extract products
      const productElements = soup.select('.product-card');

      for (const element of productElements) {
        const product = {
          title: element.find('.title').text.strip(),
          price: parseFloat(
            element.find('.price').text.replace('$', '')
          ),
          rating: parseFloat(
            element.find('.rating').text
          ),
          url: element.find('a').get('href'),
          imageUrl: element.find('img').get('src'),
          scrapedAt: new Date()
        };

        products.push(product);
      }
    }

    // 4. Process with pandas
    const df = pandas.DataFrame(products);

    // Clean data
    df.dropna();
    df.drop_duplicates();

    // Filter high-rated products
    const filtered = df[df['rating'] >= 4.0];

    // Sort by price
    filtered.sort_values('price', { ascending: false });

    // Export to CSV
    filtered.to_csv('products.csv', { index: false });

    return filtered.to_dict('records');
  }
}
```

## Example 7: Dynamic Content Scraping

**From:** `examples/social-media.ts` and `src/browsers/selenium-driver.ts`

### Selenium + BeautifulSoup Combined

```typescript
export class SocialMediaScraper {
  /**
   * Scrape JavaScript-rendered content
   */
  async scrapeDynamicContent(url: string): Promise<Post[]> {
    // 1. Initialize Selenium WebDriver
    const driver = new selenium.webdriver.Chrome({
      options: new selenium.webdriver.chrome.options.Options()
        .add_argument('--headless')
        .add_argument('--disable-gpu')
    });

    try {
      // 2. Navigate to page
      await driver.get(url);

      // 3. Wait for content to load
      const wait = new selenium.webdriver.support.ui.WebDriverWait(driver, 10);
      await wait.until(
        selenium.webdriver.support.ui.until.element_located(
          selenium.webdriver.common.by.By.CSS_SELECTOR,
          '.post'
        )
      );

      // 4. Scroll to load more posts
      for (let i = 0; i < 5; i++) {
        await driver.execute_script(
          'window.scrollTo(0, document.body.scrollHeight)'
        );
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 5. Get page source
      const pageSource = await driver.page_source;

      // 6. Parse with BeautifulSoup
      const soup = new bs4.BeautifulSoup(pageSource, 'html.parser');

      // 7. Extract posts
      const postElements = soup.select('.post');

      const posts = postElements.map((el: any) => ({
        author: el.find('.author').text.strip(),
        content: el.find('.content').text.strip(),
        likes: parseInt(el.find('.likes').text),
        timestamp: new Date(el.find('time').get('datetime')),
        hashtags: this.extractHashtags(el.find('.content').text),
        scrapedAt: new Date()
      }));

      // 8. Process with pandas
      const df = pandas.DataFrame(posts);

      // Calculate engagement metrics
      const avgLikes = df['likes'].mean();
      const topPosts = df.sort_values('likes', { ascending: false }).head(10);

      console.log('Average likes:', avgLikes);
      console.log('Top posts:', topPosts.to_dict('records'));

      return posts;

    } finally {
      // Always cleanup
      await driver.quit();
    }
  }
}
```

## The Power of Elide Polyglot

All these examples demonstrate:

1. **Direct Python Library Access**: Import and use Python libraries with `import ... from 'python:...'`
2. **Seamless Integration**: Python objects work naturally in TypeScript
3. **Type Safety**: TypeScript interfaces provide type checking
4. **Async/Await**: Automatic bridging between Python and TypeScript async
5. **No Overhead**: Direct method calls, no subprocess or IPC
6. **Production Ready**: Full error handling and resource management

This is truly revolutionary - the best of Python's rich ecosystem with TypeScript's modern syntax and type safety!
