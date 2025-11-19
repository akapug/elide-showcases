/**
 * News Aggregator Example
 *
 * Demonstrates scraping news articles from multiple sources using
 * Elide's polyglot capabilities with Python's newspaper3k library in TypeScript.
 */

// @ts-ignore - Elide polyglot imports
import newspaper from 'python:newspaper';
// @ts-ignore
import requests from 'python:requests';
// @ts-ignore
import bs4 from 'python:bs4';
// @ts-ignore
import re from 'python:re';

import { PolygotScraper } from '../src/scraper';
import { HTMLParser } from '../src/parsers/html-parser';
import { PandasProcessor } from '../src/data/pandas-processor';

/**
 * Article interface
 */
export interface Article {
  id?: string;
  title: string;
  url: string;
  source: string;
  authors?: string[];
  publishDate?: Date;
  text?: string;
  summary?: string;
  keywords?: string[];
  images?: string[];
  videos?: string[];
  category?: string;
  language?: string;
  scrapedAt: Date;
}

/**
 * News source configuration
 */
export interface NewsSource {
  name: string;
  url: string;
  articleSelector?: string;
  titleSelector?: string;
  urlSelector?: string;
  category?: string;
}

/**
 * Aggregator configuration
 */
export interface AggregatorConfig {
  /** News sources to scrape */
  sources: string[] | NewsSource[];

  /** Date range for articles */
  dateRange?: {
    since?: string | Date;
    until?: string | Date;
  };

  /** Keywords to filter articles */
  keywords?: string[];

  /** Categories to include */
  categories?: string[];

  /** Languages to include */
  languages?: string[];

  /** Maximum articles per source */
  maxArticlesPerSource?: number;

  /** Extract full article content */
  extractContent?: boolean;

  /** Output file path */
  outputPath?: string;
}

/**
 * News Aggregator class
 */
export class NewsAggregator {
  private scraper: PolygotScraper;
  private config: AggregatorConfig;
  private articles: Article[] = [];

  constructor(config: AggregatorConfig) {
    this.config = {
      maxArticlesPerSource: 50,
      extractContent: true,
      languages: ['en'],
      ...config
    };

    this.scraper = new PolygotScraper({
      userAgent: 'NewsBot/1.0 (Educational Purpose)',
      timeout: 30000,
      retries: 2,
      rateLimit: 1500
    });
  }

  /**
   * Fetch articles from all sources
   */
  async fetchArticles(options?: {
    since?: string | Date;
    keywords?: string[];
  }): Promise<Article[]> {
    console.log(`Fetching articles from ${this.config.sources.length} sources...`);

    for (const source of this.config.sources) {
      console.log(`\nFetching from: ${typeof source === 'string' ? source : source.name}`);

      try {
        const sourceArticles = await this.fetchFromSource(source);

        // Apply filters
        let filtered = this.filterArticles(sourceArticles, options);

        this.articles.push(...filtered);
        console.log(`Found ${filtered.length} articles`);

      } catch (error) {
        console.error(`Error fetching from source:`, error);
      }
    }

    console.log(`\nTotal articles fetched: ${this.articles.length}`);
    return this.articles;
  }

  /**
   * Fetch articles from a single source
   */
  async fetchFromSource(source: string | NewsSource): Promise<Article[]> {
    if (typeof source === 'string') {
      return await this.fetchUsingNewspaper(source);
    } else {
      return await this.fetchUsingCustomParser(source);
    }
  }

  /**
   * Fetch articles using newspaper3k library (polyglot!)
   */
  async fetchUsingNewspaper(sourceUrl: string): Promise<Article[]> {
    try {
      // Build newspaper source - this is Python's newspaper3k in TypeScript!
      const paper = newspaper.build(sourceUrl, {
        language: this.config.languages?.[0] || 'en',
        memoize_articles: false
      });

      const articles: Article[] = [];
      const maxArticles = this.config.maxArticlesPerSource || 50;

      // Get articles from the paper
      const paperArticles = paper.articles.slice(0, maxArticles);

      for (const article of paperArticles) {
        try {
          // Download article
          article.download();

          // Parse article
          article.parse();

          // Extract NLP features if configured
          if (this.config.extractContent) {
            article.nlp();
          }

          articles.push({
            title: article.title || '',
            url: article.url || sourceUrl,
            source: this.extractSourceName(sourceUrl),
            authors: article.authors ? Array.from(article.authors) : [],
            publishDate: article.publish_date ? new Date(article.publish_date) : undefined,
            text: article.text || undefined,
            summary: article.summary || undefined,
            keywords: article.keywords ? Array.from(article.keywords) : [],
            images: article.images ? Array.from(article.images) : [],
            videos: article.movies ? Array.from(article.movies) : [],
            language: article.meta_lang || 'en',
            scrapedAt: new Date()
          });

        } catch (error) {
          console.error(`Error parsing article: ${error}`);
        }
      }

      return articles;

    } catch (error) {
      console.error(`Error building newspaper source:`, error);
      return [];
    }
  }

  /**
   * Fetch articles using custom HTML parser
   */
  async fetchUsingCustomParser(source: NewsSource): Promise<Article[]> {
    try {
      const result = await this.scraper.scrapeStatic(source.url);
      const parser = new HTMLParser(result.data.prettify());

      // Extract article links
      const articleSelector = source.articleSelector || 'article, .article, .post';
      const articleElements = parser.select(articleSelector);

      const articles: Article[] = [];

      for (const element of articleElements) {
        try {
          const article = this.extractArticleFromElement(element, source);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          console.error('Error extracting article:', error);
        }
      }

      return articles;

    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error);
      return [];
    }
  }

  /**
   * Extract article from HTML element
   */
  private extractArticleFromElement(element: any, source: NewsSource): Article | null {
    try {
      const titleEl = element.find(source.titleSelector || 'h1, h2, h3, .title');
      const linkEl = element.find(source.urlSelector || 'a');

      if (!titleEl) {
        return null;
      }

      const title = titleEl.text.trim();
      const url = linkEl ? linkEl.attrs.href : '';

      // Extract publish date
      const dateEl = element.find('time, .date, .publish-date');
      const publishDate = dateEl ? this.parseDate(dateEl.attrs.datetime || dateEl.text) : undefined;

      // Extract summary/excerpt
      const summaryEl = element.find('.excerpt, .summary, p');
      const summary = summaryEl ? summaryEl.text.trim() : undefined;

      // Extract image
      const imageEl = element.find('img');
      const images = imageEl ? [imageEl.attrs.src] : [];

      return {
        title,
        url,
        source: source.name,
        publishDate,
        summary,
        images,
        category: source.category,
        scrapedAt: new Date()
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * Extract full article content
   */
  async extractContent(articles: Article[]): Promise<void> {
    console.log(`\nExtracting content from ${articles.length} articles...`);

    let processed = 0;

    for (const article of articles) {
      if (!article.text) {
        try {
          await this.extractArticleContent(article);
          processed++;

          if (processed % 10 === 0) {
            console.log(`Processed ${processed}/${articles.length} articles...`);
          }

        } catch (error) {
          console.error(`Error extracting content from ${article.url}:`, error);
        }
      }
    }

    console.log(`Content extraction complete. Processed ${processed} articles.`);
  }

  /**
   * Extract content from a single article
   */
  private async extractArticleContent(article: Article): Promise<void> {
    // Use newspaper3k Article class for extraction
    const newsArticle = newspaper.Article(article.url);

    // Download and parse
    newsArticle.download();
    newsArticle.parse();

    // Apply NLP
    newsArticle.nlp();

    // Update article with extracted data
    article.text = newsArticle.text || article.text;
    article.summary = newsArticle.summary || article.summary;
    article.keywords = newsArticle.keywords ? Array.from(newsArticle.keywords) : article.keywords;
    article.authors = newsArticle.authors ? Array.from(newsArticle.authors) : article.authors;
    article.publishDate = newsArticle.publish_date ? new Date(newsArticle.publish_date) : article.publishDate;
    article.images = newsArticle.images ? Array.from(newsArticle.images) : article.images;
  }

  /**
   * Filter articles based on criteria
   */
  private filterArticles(articles: Article[], options?: {
    since?: string | Date;
    keywords?: string[];
  }): Article[] {
    let filtered = articles;

    // Filter by date
    const since = options?.since || this.config.dateRange?.since;
    if (since) {
      const sinceDate = new Date(since);
      filtered = filtered.filter(a => a.publishDate && a.publishDate >= sinceDate);
    }

    const until = this.config.dateRange?.until;
    if (until) {
      const untilDate = new Date(until);
      filtered = filtered.filter(a => a.publishDate && a.publishDate <= untilDate);
    }

    // Filter by keywords
    const keywords = options?.keywords || this.config.keywords;
    if (keywords && keywords.length > 0) {
      filtered = filtered.filter(article => {
        const searchText = `${article.title} ${article.summary} ${article.keywords?.join(' ')}`.toLowerCase();
        return keywords.some(kw => searchText.includes(kw.toLowerCase()));
      });
    }

    // Filter by category
    if (this.config.categories && this.config.categories.length > 0) {
      filtered = filtered.filter(a => a.category && this.config.categories!.includes(a.category));
    }

    // Filter by language
    if (this.config.languages && this.config.languages.length > 0) {
      filtered = filtered.filter(a => !a.language || this.config.languages!.includes(a.language));
    }

    return filtered;
  }

  /**
   * Analyze articles with pandas
   */
  analyzeArticles(articles?: Article[]): any {
    const data = articles || this.articles;

    if (data.length === 0) {
      console.log('No articles to analyze');
      return null;
    }

    console.log('\n=== Article Analysis ===\n');

    const processor = new PandasProcessor(data);

    // Basic statistics
    console.log('Total articles:', processor.getRowCount());

    // Articles by source
    console.log('\nArticles by source:');
    const bySource = processor.groupBy('source').count();
    console.log(bySource);

    // Articles by date
    if (data.some(a => a.publishDate)) {
      console.log('\nArticles by publish date:');
      // Group by date
      const withDates = data.filter(a => a.publishDate);
      const dateProcessor = new PandasProcessor(withDates);

      // Add date column
      dateProcessor.addColumn('date', withDates.map(a =>
        a.publishDate!.toISOString().split('T')[0]
      ));

      const byDate = dateProcessor.groupBy('date').count();
      console.log(byDate);
    }

    // Top keywords
    console.log('\nTop keywords:');
    const allKeywords = data.flatMap(a => a.keywords || []);
    const keywordCounts = this.countOccurrences(allKeywords);
    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    console.log(topKeywords);

    // Average article length
    const articlesWithText = data.filter(a => a.text);
    if (articlesWithText.length > 0) {
      const avgLength = articlesWithText.reduce((sum, a) => sum + (a.text?.length || 0), 0) / articlesWithText.length;
      console.log(`\nAverage article length: ${Math.round(avgLength)} characters`);
    }

    // Authors
    const allAuthors = data.flatMap(a => a.authors || []);
    const uniqueAuthors = new Set(allAuthors);
    console.log(`\nUnique authors: ${uniqueAuthors.size}`);

    return {
      totalArticles: data.length,
      bySource,
      topKeywords,
      uniqueAuthors: uniqueAuthors.size
    };
  }

  /**
   * Search articles by keyword
   */
  searchArticles(query: string): Article[] {
    const lowerQuery = query.toLowerCase();

    return this.articles.filter(article => {
      const searchText = `${article.title} ${article.text} ${article.summary}`.toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }

  /**
   * Get trending topics
   */
  getTrendingTopics(limit: number = 10): Array<{ topic: string; count: number }> {
    const allKeywords = this.articles.flatMap(a => a.keywords || []);
    const counts = this.countOccurrences(allKeywords);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }

  /**
   * Get articles by source
   */
  getArticlesBySource(sourceName: string): Article[] {
    return this.articles.filter(a => a.source === sourceName);
  }

  /**
   * Get recent articles
   */
  getRecentArticles(hours: number = 24): Article[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.articles.filter(a => a.publishDate && a.publishDate >= cutoff);
  }

  /**
   * Export articles to CSV
   */
  exportToCSV(filepath?: string): void {
    const path = filepath || this.config.outputPath || 'articles.csv';

    // Prepare data for export
    const exportData = this.articles.map(a => ({
      ...a,
      authors: a.authors?.join('; '),
      keywords: a.keywords?.join('; '),
      images: a.images?.join('; '),
      videos: a.videos?.join('; ')
    }));

    const processor = new PandasProcessor(exportData);
    processor.toCSV(path);

    console.log(`\nExported ${this.articles.length} articles to ${path}`);
  }

  /**
   * Export articles to JSON
   */
  exportToJSON(filepath?: string): void {
    const path = filepath || this.config.outputPath?.replace('.csv', '.json') || 'articles.json';

    const processor = new PandasProcessor(this.articles);
    processor.toJSON(path);

    console.log(`\nExported ${this.articles.length} articles to ${path}`);
  }

  /**
   * Parse date string
   */
  private parseDate(dateStr: string): Date | undefined {
    try {
      return new Date(dateStr);
    } catch {
      return undefined;
    }
  }

  /**
   * Extract source name from URL
   */
  private extractSourceName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return url;
    }
  }

  /**
   * Count occurrences helper
   */
  private countOccurrences(items: string[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
    }

    return counts;
  }

  /**
   * Get articles
   */
  getArticles(): Article[] {
    return this.articles;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.scraper.cleanup();
  }
}

/**
 * Example usage
 */
async function main() {
  const aggregator = new NewsAggregator({
    sources: [
      'https://techcrunch.com',
      'https://theverge.com',
      'https://arstechnica.com',
      {
        name: 'Hacker News',
        url: 'https://news.ycombinator.com',
        articleSelector: '.athing',
        titleSelector: '.titleline a',
        category: 'tech'
      }
    ],
    keywords: ['AI', 'machine learning', 'startup', 'technology'],
    maxArticlesPerSource: 25,
    outputPath: 'news_articles.csv'
  });

  try {
    // Fetch articles
    const articles = await aggregator.fetchArticles({
      since: '2024-01-01',
      keywords: ['AI', 'artificial intelligence']
    });

    console.log(`\nFetched ${articles.length} articles`);

    // Extract full content for top articles
    const topArticles = articles.slice(0, 20);
    await aggregator.extractContent(topArticles);

    // Analyze articles
    const analysis = aggregator.analyzeArticles();

    // Get trending topics
    console.log('\n=== Trending Topics ===');
    const trending = aggregator.getTrendingTopics(15);
    console.log(trending);

    // Search for specific topic
    console.log('\n=== Articles about "ChatGPT" ===');
    const chatgptArticles = aggregator.searchArticles('ChatGPT');
    console.log(`Found ${chatgptArticles.length} articles`);

    // Get recent articles
    const recent = aggregator.getRecentArticles(24);
    console.log(`\n${recent.length} articles in last 24 hours`);

    // Export results
    aggregator.exportToCSV();
    aggregator.exportToJSON();

  } finally {
    await aggregator.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default NewsAggregator;
