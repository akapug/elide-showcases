/**
 * E-commerce Product Scraper Example
 *
 * Demonstrates scraping product data from e-commerce websites using
 * Elide's polyglot capabilities to combine Python libraries with TypeScript.
 */

// @ts-ignore - Elide polyglot imports
import requests from 'python:requests';
// @ts-ignore
import bs4 from 'python:bs4';
// @ts-ignore
import urllib from 'python:urllib';

import { PolygotScraper } from '../src/scraper';
import { HTMLParser } from '../src/parsers/html-parser';
import { PandasProcessor } from '../src/data/pandas-processor';
import { SeleniumDriver } from '../src/browsers/selenium-driver';

/**
 * Product interface
 */
export interface Product {
  id?: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  availability: 'in_stock' | 'out_of_stock' | 'pre_order';
  url: string;
  imageUrl?: string;
  description?: string;
  brand?: string;
  category?: string;
  sku?: string;
  features?: string[];
  specifications?: Record<string, string>;
  seller?: string;
  shippingInfo?: string;
  scrapedAt: Date;
}

/**
 * E-commerce scraper configuration
 */
export interface EcommerceConfig {
  /** Base URL of the e-commerce site */
  site: string;

  /** Categories to scrape */
  categories?: string[];

  /** Maximum pages per category */
  maxPages?: number;

  /** Minimum rating filter */
  minRating?: number;

  /** Price range filter */
  priceRange?: {
    min?: number;
    max?: number;
  };

  /** Only in-stock items */
  inStockOnly?: boolean;

  /** Use dynamic scraping (Selenium) for JavaScript-rendered content */
  useDynamic?: boolean;

  /** Save raw HTML for debugging */
  saveRawHTML?: boolean;

  /** Output file path */
  outputPath?: string;
}

/**
 * E-commerce Product Scraper
 */
export class EcommerceScraper {
  private scraper: PolygotScraper;
  private driver?: SeleniumDriver;
  private config: EcommerceConfig;
  private products: Product[] = [];

  constructor(config: EcommerceConfig) {
    this.config = {
      maxPages: 5,
      inStockOnly: false,
      useDynamic: false,
      ...config
    };

    // Initialize scraper with e-commerce-friendly settings
    this.scraper = new PolygotScraper({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      timeout: 30000,
      retries: 3,
      rateLimit: 2000, // Be respectful - 2 seconds between requests
      cache: {
        enabled: true,
        ttl: 3600
      }
    });

    // Initialize Selenium if dynamic scraping enabled
    if (this.config.useDynamic) {
      this.driver = new SeleniumDriver({
        browser: 'chrome',
        headless: true,
        implicitWait: 10
      });
    }
  }

  /**
   * Scrape products from all configured categories
   */
  async scrapeProducts(options?: {
    maxPages?: number;
    filters?: {
      minRating?: number;
      inStock?: boolean;
    };
  }): Promise<Product[]> {
    const categories = this.config.categories || await this.discoverCategories();

    console.log(`Scraping ${categories.length} categories...`);

    for (const category of categories) {
      console.log(`\nScraping category: ${category}`);
      const categoryProducts = await this.scrapeCategory(category, options?.maxPages);

      // Apply filters
      let filtered = categoryProducts;

      if (options?.filters?.minRating) {
        filtered = filtered.filter(p => p.rating && p.rating >= options.filters!.minRating!);
      }

      if (options?.filters?.inStock) {
        filtered = filtered.filter(p => p.availability === 'in_stock');
      }

      this.products.push(...filtered);
      console.log(`Found ${filtered.length} products in ${category}`);
    }

    console.log(`\nTotal products scraped: ${this.products.length}`);
    return this.products;
  }

  /**
   * Scrape a specific category
   */
  async scrapeCategory(category: string, maxPages?: number): Promise<Product[]> {
    const products: Product[] = [];
    const pagesToScrape = maxPages || this.config.maxPages || 5;

    for (let page = 1; page <= pagesToScrape; page++) {
      console.log(`  Scraping page ${page}/${pagesToScrape}...`);

      try {
        const pageUrl = this.buildCategoryUrl(category, page);
        const pageProducts = await this.scrapePage(pageUrl);

        if (pageProducts.length === 0) {
          console.log(`  No products found on page ${page}, stopping.`);
          break;
        }

        products.push(...pageProducts);

        // Check if there's a next page
        if (!await this.hasNextPage(pageUrl)) {
          console.log(`  Last page reached.`);
          break;
        }

      } catch (error) {
        console.error(`  Error scraping page ${page}:`, error);
      }
    }

    return products;
  }

  /**
   * Scrape products from a single page
   */
  async scrapePage(url: string): Promise<Product[]> {
    if (this.config.useDynamic && this.driver) {
      return await this.scrapePageDynamic(url);
    } else {
      return await this.scrapePageStatic(url);
    }
  }

  /**
   * Scrape page using static HTML parsing
   */
  private async scrapePageStatic(url: string): Promise<Product[]> {
    const result = await this.scraper.scrapeStatic(url);
    const parser = new HTMLParser(result.data.prettify());

    // Extract product listings - adjust selectors based on target site
    const productElements = parser.select('.product-card, .product-item, [data-product]');

    const products: Product[] = [];

    for (const element of productElements) {
      try {
        const product = this.extractProductFromElement(element, url);
        if (product) {
          products.push(product);
        }
      } catch (error) {
        console.error('Error extracting product:', error);
      }
    }

    return products;
  }

  /**
   * Scrape page using Selenium (for JavaScript-rendered content)
   */
  private async scrapePageDynamic(url: string): Promise<Product[]> {
    if (!this.driver) {
      throw new Error('Selenium driver not initialized');
    }

    await this.driver.navigate(url);

    // Wait for products to load
    await this.driver.waitForElement('cssSelector', '.product-card, .product-item');

    // Scroll to load lazy-loaded content
    await this.scrollToLoadAll();

    // Extract products using Selenium
    const productData = await this.driver.extractData('.product-card, .product-item', {
      title: '.product-title, h3, h4',
      price: '.price, .product-price',
      rating: '.rating, .stars',
      url: 'a'
    });

    return productData.map(data => this.normalizeProduct(data, url));
  }

  /**
   * Extract product data from HTML element
   */
  private extractProductFromElement(element: any, baseUrl: string): Product | null {
    try {
      // Extract basic product info - adjust selectors for your target site
      const titleEl = element.find('.product-title, h3, h4');
      const priceEl = element.find('.price, .product-price');
      const linkEl = element.find('a');

      if (!titleEl || !priceEl) {
        return null;
      }

      const title = titleEl.text.trim();
      const priceText = priceEl.text.trim();
      const price = this.parsePrice(priceText);
      const url = linkEl ? urllib.parse.urljoin(baseUrl, linkEl.attrs.href) : baseUrl;

      // Extract optional fields
      const ratingEl = element.find('.rating, .stars');
      const rating = ratingEl ? this.parseRating(ratingEl.text) : undefined;

      const reviewCountEl = element.find('.review-count, .reviews');
      const reviewCount = reviewCountEl ? this.parseReviewCount(reviewCountEl.text) : undefined;

      const imageEl = element.find('img');
      const imageUrl = imageEl ? imageEl.attrs.src : undefined;

      const brandEl = element.find('.brand, .manufacturer');
      const brand = brandEl ? brandEl.text.trim() : undefined;

      // Determine availability
      const availability = this.determineAvailability(element);

      return {
        title,
        price: price.amount,
        currency: price.currency,
        rating,
        reviewCount,
        availability,
        url,
        imageUrl,
        brand,
        scrapedAt: new Date()
      };

    } catch (error) {
      console.error('Error extracting product:', error);
      return null;
    }
  }

  /**
   * Scrape detailed product information
   */
  async scrapeProductDetails(product: Product): Promise<Product> {
    console.log(`Scraping details for: ${product.title}`);

    try {
      const result = await this.scraper.scrapeStatic(product.url);
      const parser = new HTMLParser(result.data.prettify());

      // Extract detailed information
      const descriptionEl = parser.selectOne('.description, .product-description');
      if (descriptionEl) {
        product.description = descriptionEl.text.trim();
      }

      // Extract features
      const featureElements = parser.select('.features li, .feature-list li');
      if (featureElements.length > 0) {
        product.features = featureElements.map(el => el.text.trim());
      }

      // Extract specifications
      const specTable = parser.extractTable('.specifications, .specs');
      if (specTable.rows.length > 0) {
        product.specifications = {};
        for (const [key, value] of specTable.rows) {
          if (key && value) {
            product.specifications[key] = value;
          }
        }
      }

      // Extract SKU
      const skuEl = parser.selectOne('[data-sku], .sku');
      if (skuEl) {
        product.sku = skuEl.text.trim() || skuEl.attrs['data-sku'];
      }

      // Extract seller info
      const sellerEl = parser.selectOne('.seller, .sold-by');
      if (sellerEl) {
        product.seller = sellerEl.text.trim();
      }

      // Extract shipping info
      const shippingEl = parser.selectOne('.shipping-info, .delivery-info');
      if (shippingEl) {
        product.shippingInfo = shippingEl.text.trim();
      }

    } catch (error) {
      console.error(`Error scraping details for ${product.url}:`, error);
    }

    return product;
  }

  /**
   * Parse price from text
   */
  private parsePrice(priceText: string): { amount: number; currency: string } {
    // Remove whitespace
    const cleaned = priceText.trim();

    // Extract currency symbol
    const currencyMatch = cleaned.match(/[$€£¥]/);
    const currency = currencyMatch ? currencyMatch[0] : 'USD';

    // Extract numeric value
    const numberMatch = cleaned.match(/[\d,]+\.?\d*/);
    const amount = numberMatch ? parseFloat(numberMatch[0].replace(/,/g, '')) : 0;

    return { amount, currency };
  }

  /**
   * Parse rating from text or element
   */
  private parseRating(ratingText: string): number | undefined {
    const match = ratingText.match(/(\d+\.?\d*)\s*(?:out of|\/)\s*(\d+)/);
    if (match) {
      return parseFloat(match[1]);
    }

    const numberMatch = ratingText.match(/\d+\.?\d*/);
    if (numberMatch) {
      return parseFloat(numberMatch[0]);
    }

    return undefined;
  }

  /**
   * Parse review count from text
   */
  private parseReviewCount(reviewText: string): number | undefined {
    const match = reviewText.match(/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  /**
   * Determine product availability
   */
  private determineAvailability(element: any): 'in_stock' | 'out_of_stock' | 'pre_order' {
    const availabilityEl = element.find('.availability, .stock-status');

    if (availabilityEl) {
      const text = availabilityEl.text.toLowerCase();

      if (text.includes('out of stock') || text.includes('unavailable')) {
        return 'out_of_stock';
      }

      if (text.includes('pre-order') || text.includes('coming soon')) {
        return 'pre_order';
      }
    }

    return 'in_stock';
  }

  /**
   * Normalize product data from various formats
   */
  private normalizeProduct(data: any, baseUrl: string): Product {
    const price = this.parsePrice(data.price || '0');

    return {
      title: data.title || '',
      price: price.amount,
      currency: price.currency,
      rating: data.rating ? this.parseRating(data.rating) : undefined,
      availability: 'in_stock',
      url: data.url ? urllib.parse.urljoin(baseUrl, data.url) : baseUrl,
      scrapedAt: new Date()
    };
  }

  /**
   * Build category URL
   */
  private buildCategoryUrl(category: string, page: number): string {
    const baseUrl = this.config.site;

    // Adjust URL pattern based on site structure
    return `${baseUrl}/category/${category}?page=${page}`;
  }

  /**
   * Check if there's a next page
   */
  private async hasNextPage(currentUrl: string): Promise<boolean> {
    // Implementation would check for "next" button or pagination
    return false; // Simplified
  }

  /**
   * Discover categories from the site
   */
  private async discoverCategories(): Promise<string[]> {
    console.log('Discovering categories...');

    const result = await this.scraper.scrapeStatic(this.config.site);
    const parser = new HTMLParser(result.data.prettify());

    // Extract category links - adjust selector
    const categoryLinks = parser.select('.category-link, .nav-category a');

    return categoryLinks.map(link => link.text.trim()).filter(Boolean);
  }

  /**
   * Scroll to load all lazy-loaded content
   */
  private async scrollToLoadAll(): Promise<void> {
    if (!this.driver) return;

    const scrollHeight = await this.driver.executeScript('return document.body.scrollHeight');

    for (let y = 0; y < scrollHeight; y += 500) {
      await this.driver.scrollTo(0, y);
      await this.sleep(200);
    }
  }

  /**
   * Analyze products with pandas
   */
  analyzeProducts(products?: Product[]): void {
    const data = products || this.products;

    if (data.length === 0) {
      console.log('No products to analyze');
      return;
    }

    console.log('\n=== Product Analysis ===\n');

    const processor = new PandasProcessor(data);

    // Basic statistics
    console.log('Total products:', processor.getRowCount());
    console.log('\nPrice statistics:');
    const stats = processor.describe();
    console.log(JSON.stringify(stats.price, null, 2));

    // Group by category
    if (data.some(p => p.category)) {
      console.log('\nProducts by category:');
      const byCategory = processor.groupBy('category').count();
      console.log(byCategory);
    }

    // Average rating
    const avgRating = processor.getRaw()['rating'].mean();
    console.log(`\nAverage rating: ${avgRating?.toFixed(2)}`);

    // Price distribution
    console.log('\nPrice ranges:');
    const priceRanges = {
      'Under $50': data.filter(p => p.price < 50).length,
      '$50-$100': data.filter(p => p.price >= 50 && p.price < 100).length,
      '$100-$200': data.filter(p => p.price >= 100 && p.price < 200).length,
      'Over $200': data.filter(p => p.price >= 200).length
    };
    console.log(priceRanges);
  }

  /**
   * Export products to CSV
   */
  exportToCSV(filepath?: string): void {
    const path = filepath || this.config.outputPath || 'products.csv';

    const processor = new PandasProcessor(this.products);
    processor.toCSV(path);

    console.log(`\nExported ${this.products.length} products to ${path}`);
  }

  /**
   * Export products to JSON
   */
  exportToJSON(filepath?: string): void {
    const path = filepath || this.config.outputPath?.replace('.csv', '.json') || 'products.json';

    const processor = new PandasProcessor(this.products);
    processor.toJSON(path);

    console.log(`\nExported ${this.products.length} products to ${path}`);
  }

  /**
   * Get products
   */
  getProducts(): Product[] {
    return this.products;
  }

  /**
   * Sleep utility
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.scraper.cleanup();

    if (this.driver) {
      await this.driver.quit();
    }
  }
}

/**
 * Example usage
 */
async function main() {
  const scraper = new EcommerceScraper({
    site: 'https://example-shop.com',
    categories: ['electronics', 'books', 'clothing'],
    maxPages: 3,
    outputPath: 'products.csv'
  });

  try {
    // Scrape products
    const products = await scraper.scrapeProducts({
      maxPages: 3,
      filters: {
        minRating: 4.0,
        inStock: true
      }
    });

    console.log(`\nScraped ${products.length} products`);

    // Scrape detailed info for top products
    const topProducts = products
      .filter(p => p.rating && p.rating >= 4.5)
      .slice(0, 10);

    console.log(`\nScraping details for ${topProducts.length} top-rated products...`);

    for (const product of topProducts) {
      await scraper.scrapeProductDetails(product);
    }

    // Analyze data
    scraper.analyzeProducts();

    // Export results
    scraper.exportToCSV();
    scraper.exportToJSON();

  } finally {
    await scraper.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default EcommerceScraper;
