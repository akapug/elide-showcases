/**
 * Social Media Scraper Example
 *
 * Demonstrates scraping social media posts, profiles, and engagement metrics
 * using Elide's polyglot capabilities with Python libraries in TypeScript.
 */

// @ts-ignore - Elide polyglot imports
import requests from 'python:requests';
// @ts-ignore
import bs4 from 'python:bs4';
// @ts-ignore
import json from 'python:json';
// @ts-ignore
import re from 'python:re';
// @ts-ignore
import time from 'python:time';

import { PolygotScraper } from '../src/scraper';
import { HTMLParser } from '../src/parsers/html-parser';
import { SeleniumDriver } from '../src/browsers/selenium-driver';
import { PandasProcessor } from '../src/data/pandas-processor';

/**
 * Social media platform types
 */
export type Platform = 'twitter' | 'linkedin' | 'reddit' | 'facebook' | 'instagram';

/**
 * Post interface
 */
export interface Post {
  id?: string;
  platform: Platform;
  author: string;
  authorUrl?: string;
  content: string;
  url: string;
  timestamp?: Date;
  likes?: number;
  shares?: number;
  comments?: number;
  hashtags?: string[];
  mentions?: string[];
  media?: {
    type: 'image' | 'video' | 'link';
    url: string;
  }[];
  scrapedAt: Date;
}

/**
 * Profile interface
 */
export interface Profile {
  platform: Platform;
  username: string;
  displayName?: string;
  bio?: string;
  url: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  posts?: number;
  location?: string;
  website?: string;
  joinDate?: Date;
  avatarUrl?: string;
  bannerUrl?: string;
  scrapedAt: Date;
}

/**
 * Engagement metrics
 */
export interface EngagementMetrics {
  totalPosts: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  avgLikesPerPost: number;
  avgSharesPerPost: number;
  avgCommentsPerPost: number;
  engagementRate: number;
  topHashtags: Array<{ tag: string; count: number }>;
  topMentions: Array<{ user: string; count: number }>;
  postsByDay: Record<string, number>;
}

/**
 * Scraper configuration
 */
export interface SocialMediaConfig {
  /** Social media platform */
  platform: Platform;

  /** Authentication credentials */
  authentication?: {
    token?: string;
    apiKey?: string;
    username?: string;
    password?: string;
  };

  /** Use Selenium for JavaScript-heavy platforms */
  useDynamic?: boolean;

  /** Rate limiting (ms between requests) */
  rateLimit?: number;

  /** Output file path */
  outputPath?: string;
}

/**
 * Social Media Scraper class
 */
export class SocialMediaScraper {
  private scraper: PolygotScraper;
  private driver?: SeleniumDriver;
  private config: SocialMediaConfig;
  private posts: Post[] = [];
  private profiles: Profile[] = [];

  constructor(config: SocialMediaConfig) {
    this.config = {
      useDynamic: false,
      rateLimit: 2000,
      ...config
    };

    this.scraper = new PolygotScraper({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timeout: 30000,
      retries: 2,
      rateLimit: this.config.rateLimit,
      session: true // Maintain session for authentication
    });

    if (this.config.useDynamic) {
      this.driver = new SeleniumDriver({
        browser: 'chrome',
        headless: true,
        implicitWait: 10
      });
    }
  }

  /**
   * Scrape posts by hashtag
   */
  async scrapePosts(options: {
    hashtags?: string[];
    users?: string[];
    maxPosts?: number;
    since?: Date;
  }): Promise<Post[]> {
    console.log(`Scraping posts from ${this.config.platform}...`);

    const posts: Post[] = [];

    // Scrape by hashtags
    if (options.hashtags && options.hashtags.length > 0) {
      for (const hashtag of options.hashtags) {
        console.log(`\nScraping hashtag: #${hashtag}`);

        try {
          const hashtagPosts = await this.scrapeHashtag(hashtag, options.maxPosts);
          posts.push(...hashtagPosts);

          console.log(`Found ${hashtagPosts.length} posts for #${hashtag}`);
        } catch (error) {
          console.error(`Error scraping hashtag ${hashtag}:`, error);
        }
      }
    }

    // Scrape by users
    if (options.users && options.users.length > 0) {
      for (const user of options.users) {
        console.log(`\nScraping user: @${user}`);

        try {
          const userPosts = await this.scrapeUserPosts(user, options.maxPosts);
          posts.push(...userPosts);

          console.log(`Found ${userPosts.length} posts from @${user}`);
        } catch (error) {
          console.error(`Error scraping user ${user}:`, error);
        }
      }
    }

    // Filter by date if specified
    let filtered = posts;
    if (options.since) {
      filtered = posts.filter(p => p.timestamp && p.timestamp >= options.since!);
    }

    this.posts.push(...filtered);
    console.log(`\nTotal posts scraped: ${this.posts.length}`);

    return filtered;
  }

  /**
   * Scrape posts by hashtag
   */
  private async scrapeHashtag(hashtag: string, maxPosts?: number): Promise<Post[]> {
    const url = this.buildHashtagUrl(hashtag);

    if (this.config.useDynamic && this.driver) {
      return await this.scrapeHashtagDynamic(url, maxPosts);
    } else {
      return await this.scrapeHashtagStatic(url, maxPosts);
    }
  }

  /**
   * Scrape hashtag using static HTML parsing
   */
  private async scrapeHashtagStatic(url: string, maxPosts?: number): Promise<Post[]> {
    const result = await this.scraper.scrapeStatic(url);
    const parser = new HTMLParser(result.data.prettify());

    const posts: Post[] = [];
    const postElements = parser.select(this.getPostSelector());

    const limit = maxPosts || postElements.length;

    for (let i = 0; i < Math.min(limit, postElements.length); i++) {
      try {
        const post = this.extractPostFromElement(postElements[i]);
        if (post) {
          posts.push(post);
        }
      } catch (error) {
        console.error('Error extracting post:', error);
      }
    }

    return posts;
  }

  /**
   * Scrape hashtag using Selenium
   */
  private async scrapeHashtagDynamic(url: string, maxPosts?: number): Promise<Post[]> {
    if (!this.driver) {
      throw new Error('Selenium driver not initialized');
    }

    await this.driver.navigate(url);

    // Wait for posts to load
    await this.driver.waitForElement('cssSelector', this.getPostSelector());

    // Scroll to load more posts
    if (maxPosts && maxPosts > 20) {
      await this.scrollToLoadPosts(maxPosts);
    }

    // Extract posts
    const postData = await this.driver.extractData(this.getPostSelector(), {
      author: this.getAuthorSelector(),
      content: this.getContentSelector(),
      timestamp: this.getTimestampSelector(),
      likes: this.getLikesSelector()
    });

    return postData.map(data => this.normalizePost(data));
  }

  /**
   * Scrape user posts
   */
  private async scrapeUserPosts(username: string, maxPosts?: number): Promise<Post[]> {
    const url = this.buildUserUrl(username);

    if (this.config.useDynamic && this.driver) {
      return await this.scrapeHashtagDynamic(url, maxPosts);
    } else {
      return await this.scrapeHashtagStatic(url, maxPosts);
    }
  }

  /**
   * Scrape user profiles
   */
  async scrapeProfiles(usernames: string[]): Promise<Profile[]> {
    console.log(`\nScraping ${usernames.length} profiles...`);

    const profiles: Profile[] = [];

    for (const username of usernames) {
      console.log(`Scraping profile: @${username}`);

      try {
        const profile = await this.scrapeProfile(username);
        if (profile) {
          profiles.push(profile);
          this.profiles.push(profile);
        }
      } catch (error) {
        console.error(`Error scraping profile ${username}:`, error);
      }
    }

    return profiles;
  }

  /**
   * Scrape individual profile
   */
  private async scrapeProfile(username: string): Promise<Profile | null> {
    const url = this.buildUserUrl(username);

    try {
      const result = await this.scraper.scrapeStatic(url);
      const parser = new HTMLParser(result.data.prettify());

      return this.extractProfileFromPage(parser, username);

    } catch (error) {
      console.error(`Error scraping profile ${username}:`, error);
      return null;
    }
  }

  /**
   * Extract post from HTML element
   */
  private extractPostFromElement(element: any): Post | null {
    try {
      const contentEl = element.find(this.getContentSelector());
      const authorEl = element.find(this.getAuthorSelector());

      if (!contentEl || !authorEl) {
        return null;
      }

      const content = contentEl.text.trim();
      const author = authorEl.text.trim();

      // Extract hashtags
      const hashtags = this.extractHashtags(content);

      // Extract mentions
      const mentions = this.extractMentions(content);

      // Extract engagement metrics
      const likesEl = element.find(this.getLikesSelector());
      const sharesEl = element.find(this.getSharesSelector());
      const commentsEl = element.find(this.getCommentsSelector());

      const likes = likesEl ? this.parseNumber(likesEl.text) : undefined;
      const shares = sharesEl ? this.parseNumber(sharesEl.text) : undefined;
      const comments = commentsEl ? this.parseNumber(commentsEl.text) : undefined;

      // Extract timestamp
      const timestampEl = element.find(this.getTimestampSelector());
      const timestamp = timestampEl ? this.parseTimestamp(timestampEl.text || timestampEl.attrs.datetime) : undefined;

      // Extract media
      const media = this.extractMedia(element);

      // Extract URL
      const linkEl = element.find('a');
      const url = linkEl ? linkEl.attrs.href : '';

      return {
        platform: this.config.platform,
        author,
        content,
        url,
        timestamp,
        likes,
        shares,
        comments,
        hashtags,
        mentions,
        media,
        scrapedAt: new Date()
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * Extract profile from page
   */
  private extractProfileFromPage(parser: HTMLParser, username: string): Profile {
    const displayNameEl = parser.selectOne('.profile-name, .display-name, h1');
    const bioEl = parser.selectOne('.bio, .description, .about');
    const followersEl = parser.selectOne('[data-followers], .followers-count');
    const followingEl = parser.selectOne('[data-following], .following-count');
    const postsEl = parser.selectOne('[data-posts], .posts-count');

    return {
      platform: this.config.platform,
      username,
      displayName: displayNameEl?.text.trim(),
      bio: bioEl?.text.trim(),
      url: this.buildUserUrl(username),
      followers: followersEl ? this.parseNumber(followersEl.text) : undefined,
      following: followingEl ? this.parseNumber(followingEl.text) : undefined,
      posts: postsEl ? this.parseNumber(postsEl.text) : undefined,
      scrapedAt: new Date()
    };
  }

  /**
   * Analyze engagement metrics
   */
  analyzeEngagement(posts?: Post[]): EngagementMetrics {
    const data = posts || this.posts;

    if (data.length === 0) {
      throw new Error('No posts to analyze');
    }

    console.log('\n=== Engagement Analysis ===\n');

    const totalLikes = data.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalShares = data.reduce((sum, p) => sum + (p.shares || 0), 0);
    const totalComments = data.reduce((sum, p) => sum + (p.comments || 0), 0);

    const avgLikesPerPost = totalLikes / data.length;
    const avgSharesPerPost = totalShares / data.length;
    const avgCommentsPerPost = totalComments / data.length;

    // Engagement rate = (likes + shares + comments) / posts
    const totalEngagement = totalLikes + totalShares + totalComments;
    const engagementRate = totalEngagement / data.length;

    // Top hashtags
    const allHashtags = data.flatMap(p => p.hashtags || []);
    const hashtagCounts = this.countOccurrences(allHashtags);
    const topHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    // Top mentions
    const allMentions = data.flatMap(p => p.mentions || []);
    const mentionCounts = this.countOccurrences(allMentions);
    const topMentions = Object.entries(mentionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([user, count]) => ({ user, count }));

    // Posts by day
    const postsByDay: Record<string, number> = {};
    for (const post of data) {
      if (post.timestamp) {
        const day = post.timestamp.toISOString().split('T')[0];
        postsByDay[day] = (postsByDay[day] || 0) + 1;
      }
    }

    const metrics: EngagementMetrics = {
      totalPosts: data.length,
      totalLikes,
      totalShares,
      totalComments,
      avgLikesPerPost,
      avgSharesPerPost,
      avgCommentsPerPost,
      engagementRate,
      topHashtags,
      topMentions,
      postsByDay
    };

    // Display metrics
    console.log('Total Posts:', metrics.totalPosts);
    console.log('Total Likes:', metrics.totalLikes);
    console.log('Total Shares:', metrics.totalShares);
    console.log('Total Comments:', metrics.totalComments);
    console.log(`\nAverage Likes per Post: ${metrics.avgLikesPerPost.toFixed(2)}`);
    console.log(`Average Shares per Post: ${metrics.avgSharesPerPost.toFixed(2)}`);
    console.log(`Average Comments per Post: ${metrics.avgCommentsPerPost.toFixed(2)}`);
    console.log(`Engagement Rate: ${metrics.engagementRate.toFixed(2)}`);

    console.log('\nTop Hashtags:');
    console.log(metrics.topHashtags.slice(0, 10));

    console.log('\nTop Mentions:');
    console.log(metrics.topMentions.slice(0, 10));

    return metrics;
  }

  /**
   * Export posts to CSV
   */
  exportPostsToCSV(filepath?: string): void {
    const path = filepath || this.config.outputPath || 'social_posts.csv';

    const exportData = this.posts.map(p => ({
      ...p,
      hashtags: p.hashtags?.join('; '),
      mentions: p.mentions?.join('; '),
      media: p.media?.map(m => m.url).join('; ')
    }));

    const processor = new PandasProcessor(exportData);
    processor.toCSV(path);

    console.log(`\nExported ${this.posts.length} posts to ${path}`);
  }

  /**
   * Export profiles to CSV
   */
  exportProfilesToCSV(filepath?: string): void {
    const path = filepath || 'social_profiles.csv';

    const processor = new PandasProcessor(this.profiles);
    processor.toCSV(path);

    console.log(`\nExported ${this.profiles.length} profiles to ${path}`);
  }

  /**
   * Build hashtag URL for platform
   */
  private buildHashtagUrl(hashtag: string): string {
    const baseUrls: Record<Platform, string> = {
      twitter: `https://twitter.com/hashtag/${hashtag}`,
      linkedin: `https://www.linkedin.com/feed/hashtag/${hashtag}`,
      reddit: `https://www.reddit.com/search/?q=%23${hashtag}`,
      facebook: `https://www.facebook.com/hashtag/${hashtag}`,
      instagram: `https://www.instagram.com/explore/tags/${hashtag}/`
    };

    return baseUrls[this.config.platform];
  }

  /**
   * Build user URL for platform
   */
  private buildUserUrl(username: string): string {
    const baseUrls: Record<Platform, string> = {
      twitter: `https://twitter.com/${username}`,
      linkedin: `https://www.linkedin.com/in/${username}`,
      reddit: `https://www.reddit.com/user/${username}`,
      facebook: `https://www.facebook.com/${username}`,
      instagram: `https://www.instagram.com/${username}/`
    };

    return baseUrls[this.config.platform];
  }

  /**
   * Get post selector for platform
   */
  private getPostSelector(): string {
    const selectors: Record<Platform, string> = {
      twitter: 'article[data-testid="tweet"]',
      linkedin: '.feed-shared-update-v2',
      reddit: '.Post',
      facebook: '[data-pagelet^="FeedUnit"]',
      instagram: 'article'
    };

    return selectors[this.config.platform];
  }

  /**
   * Get author selector for platform
   */
  private getAuthorSelector(): string {
    return '.author, .username, [data-author]';
  }

  /**
   * Get content selector for platform
   */
  private getContentSelector(): string {
    return '.content, .text, [data-content]';
  }

  /**
   * Get timestamp selector for platform
   */
  private getTimestampSelector(): string {
    return 'time, .timestamp, [data-time]';
  }

  /**
   * Get likes selector for platform
   */
  private getLikesSelector(): string {
    return '[data-likes], .likes-count, .like-count';
  }

  /**
   * Get shares selector for platform
   */
  private getSharesSelector(): string {
    return '[data-shares], .shares-count, .retweet-count';
  }

  /**
   * Get comments selector for platform
   */
  private getCommentsSelector(): string {
    return '[data-comments], .comments-count, .reply-count';
  }

  /**
   * Extract hashtags from text
   */
  private extractHashtags(text: string): string[] {
    const pattern = /#(\w+)/g;
    const matches = text.match(pattern) || [];
    return matches.map(m => m.substring(1));
  }

  /**
   * Extract mentions from text
   */
  private extractMentions(text: string): string[] {
    const pattern = /@(\w+)/g;
    const matches = text.match(pattern) || [];
    return matches.map(m => m.substring(1));
  }

  /**
   * Extract media from element
   */
  private extractMedia(element: any): Array<{ type: 'image' | 'video' | 'link'; url: string }> {
    const media: Array<{ type: 'image' | 'video' | 'link'; url: string }> = [];

    // Images
    const images = element.findAll('img');
    for (const img of images) {
      if (img.attrs.src) {
        media.push({ type: 'image', url: img.attrs.src });
      }
    }

    // Videos
    const videos = element.findAll('video');
    for (const video of videos) {
      if (video.attrs.src) {
        media.push({ type: 'video', url: video.attrs.src });
      }
    }

    return media;
  }

  /**
   * Parse number from text (handles K, M suffixes)
   */
  private parseNumber(text: string): number | undefined {
    const cleaned = text.trim().replace(/,/g, '');

    if (cleaned.includes('K')) {
      return parseFloat(cleaned.replace('K', '')) * 1000;
    }

    if (cleaned.includes('M')) {
      return parseFloat(cleaned.replace('M', '')) * 1000000;
    }

    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parse timestamp
   */
  private parseTimestamp(text: string): Date | undefined {
    try {
      return new Date(text);
    } catch {
      return undefined;
    }
  }

  /**
   * Normalize post data
   */
  private normalizePost(data: any): Post {
    return {
      platform: this.config.platform,
      author: data.author || '',
      content: data.content || '',
      url: data.url || '',
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      likes: data.likes ? this.parseNumber(data.likes) : undefined,
      scrapedAt: new Date()
    };
  }

  /**
   * Scroll to load more posts
   */
  private async scrollToLoadPosts(targetCount: number): Promise<void> {
    if (!this.driver) return;

    let currentCount = 0;
    let scrollAttempts = 0;
    const maxScrolls = 50;

    while (currentCount < targetCount && scrollAttempts < maxScrolls) {
      await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
      await this.sleep(2000);

      const posts = await this.driver.findElements('cssSelector', this.getPostSelector());
      currentCount = posts.length;

      scrollAttempts++;
    }
  }

  /**
   * Count occurrences
   */
  private countOccurrences(items: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
    }
    return counts;
  }

  /**
   * Sleep utility
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get posts
   */
  getPosts(): Post[] {
    return this.posts;
  }

  /**
   * Get profiles
   */
  getProfiles(): Profile[] {
    return this.profiles;
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
  const scraper = new SocialMediaScraper({
    platform: 'twitter',
    useDynamic: true,
    outputPath: 'social_posts.csv'
  });

  try {
    // Scrape posts by hashtags
    const posts = await scraper.scrapePosts({
      hashtags: ['webdev', 'typescript', 'elide'],
      maxPosts: 100
    });

    console.log(`\nScraped ${posts.length} posts`);

    // Scrape profiles
    const users = ['elidelang', 'typescript', 'nodejs'];
    const profiles = await scraper.scrapeProfiles(users);

    console.log(`\nScraped ${profiles.length} profiles`);

    // Analyze engagement
    const metrics = scraper.analyzeEngagement();

    // Export results
    scraper.exportPostsToCSV();
    scraper.exportProfilesToCSV();

  } finally {
    await scraper.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default SocialMediaScraper;
