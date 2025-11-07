/**
 * CMS Platform - Content Manager
 *
 * Manages articles, categories, tags, and publishing workflow.
 * Integrates with markdown engine for content processing.
 */

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentHtml: string;
  excerpt: string;
  status: 'draft' | 'review' | 'published';
  authorId: string;
  categories: string[];
  tags: string[];
  featuredImage?: string;
  metadata: ArticleMetadata;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  version: number;
}

interface ArticleMetadata {
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  readingTime: number;
  wordCount: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  articleCount: number;
  createdAt: Date;
}

interface ArticleVersion {
  version: number;
  content: string;
  createdAt: Date;
  createdBy: string;
}

interface PublishingWorkflow {
  articleId: string;
  status: 'draft' | 'review' | 'published';
  reviewerId?: string;
  reviewedAt?: Date;
  publisherId?: string;
  publishedAt?: Date;
  notes?: string;
}

/**
 * Content Manager
 */
export class ContentManager {
  private articles: Map<string, Article> = new Map();
  private categories: Map<string, Category> = new Map();
  private articleVersions: Map<string, ArticleVersion[]> = new Map();
  private workflows: Map<string, PublishingWorkflow> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  /**
   * Initialize sample data
   */
  private initializeSampleData(): void {
    // Create sample categories
    const techCategory: Category = {
      id: this.generateId(),
      name: 'Technology',
      slug: 'technology',
      description: 'Tech news and tutorials',
      articleCount: 0,
      createdAt: new Date()
    };

    const designCategory: Category = {
      id: this.generateId(),
      name: 'Design',
      slug: 'design',
      description: 'Design tips and inspiration',
      articleCount: 0,
      createdAt: new Date()
    };

    this.categories.set(techCategory.id, techCategory);
    this.categories.set(designCategory.id, designCategory);
  }

  /**
   * Create new article
   */
  async createArticle(data: {
    title: string;
    content: string;
    excerpt: string;
    authorId: string;
    categories?: string[];
    tags?: string[];
    featuredImage?: string;
  }): Promise<Article> {
    const id = this.generateId();
    const slug = this.generateSlug(data.title);
    const now = new Date();

    const article: Article = {
      id,
      title: data.title,
      slug,
      content: data.content,
      contentHtml: await this.renderMarkdown(data.content),
      excerpt: data.excerpt,
      status: 'draft',
      authorId: data.authorId,
      categories: data.categories || [],
      tags: data.tags || [],
      featuredImage: data.featuredImage,
      metadata: {
        readingTime: this.calculateReadingTime(data.content),
        wordCount: this.countWords(data.content)
      },
      createdAt: now,
      updatedAt: now,
      views: 0,
      version: 1
    };

    this.articles.set(id, article);
    this.saveVersion(id, article.content, data.authorId);

    // Update category counts
    article.categories.forEach(catId => {
      const category = this.categories.get(catId);
      if (category) {
        category.articleCount++;
      }
    });

    return article;
  }

  /**
   * Update article
   */
  async updateArticle(id: string, updates: {
    title?: string;
    content?: string;
    excerpt?: string;
    categories?: string[];
    tags?: string[];
    featuredImage?: string;
  }, userId: string): Promise<Article> {
    const article = this.articles.get(id);

    if (!article) {
      throw new Error('Article not found');
    }

    // Update fields
    if (updates.title !== undefined) {
      article.title = updates.title;
      article.slug = this.generateSlug(updates.title);
    }

    if (updates.content !== undefined) {
      article.content = updates.content;
      article.contentHtml = await this.renderMarkdown(updates.content);
      article.metadata.wordCount = this.countWords(updates.content);
      article.metadata.readingTime = this.calculateReadingTime(updates.content);
      article.version++;

      // Save new version
      this.saveVersion(id, updates.content, userId);
    }

    if (updates.excerpt !== undefined) {
      article.excerpt = updates.excerpt;
    }

    if (updates.categories !== undefined) {
      // Update category counts
      article.categories.forEach(catId => {
        const category = this.categories.get(catId);
        if (category) category.articleCount--;
      });

      article.categories = updates.categories;

      updates.categories.forEach(catId => {
        const category = this.categories.get(catId);
        if (category) category.articleCount++;
      });
    }

    if (updates.tags !== undefined) {
      article.tags = updates.tags;
    }

    if (updates.featuredImage !== undefined) {
      article.featuredImage = updates.featuredImage;
    }

    article.updatedAt = new Date();

    return article;
  }

  /**
   * Delete article
   */
  async deleteArticle(id: string): Promise<void> {
    const article = this.articles.get(id);

    if (!article) {
      throw new Error('Article not found');
    }

    // Update category counts
    article.categories.forEach(catId => {
      const category = this.categories.get(catId);
      if (category) {
        category.articleCount--;
      }
    });

    this.articles.delete(id);
    this.articleVersions.delete(id);
    this.workflows.delete(id);
  }

  /**
   * Get article by ID
   */
  getArticle(id: string): Article | null {
    return this.articles.get(id) || null;
  }

  /**
   * Get article by slug
   */
  getArticleBySlug(slug: string): Article | null {
    for (const article of this.articles.values()) {
      if (article.slug === slug) {
        return article;
      }
    }
    return null;
  }

  /**
   * Get articles with filtering and pagination
   */
  getArticles(options: {
    status?: Article['status'];
    categoryId?: string;
    authorId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'views';
    sortOrder?: 'asc' | 'desc';
  } = {}): { articles: Article[]; total: number; page: number; pages: number } {
    let articles = Array.from(this.articles.values());

    // Apply filters
    if (options.status) {
      articles = articles.filter(a => a.status === options.status);
    }

    if (options.categoryId) {
      articles = articles.filter(a => a.categories.includes(options.categoryId!));
    }

    if (options.authorId) {
      articles = articles.filter(a => a.authorId === options.authorId);
    }

    if (options.search) {
      const query = options.search.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.excerpt.toLowerCase().includes(query) ||
        a.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    articles.sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const page = options.page || 1;
    const limit = options.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedArticles = articles.slice(start, end);
    const total = articles.length;
    const pages = Math.ceil(total / limit);

    return {
      articles: paginatedArticles,
      total,
      page,
      pages
    };
  }

  /**
   * Change article status
   */
  async changeStatus(id: string, status: Article['status'], userId: string): Promise<Article> {
    const article = this.articles.get(id);

    if (!article) {
      throw new Error('Article not found');
    }

    const previousStatus = article.status;
    article.status = status;
    article.updatedAt = new Date();

    // Update workflow
    const workflow = this.workflows.get(id) || {
      articleId: id,
      status: 'draft'
    };

    workflow.status = status;

    if (status === 'review') {
      workflow.reviewerId = userId;
      workflow.reviewedAt = new Date();
    }

    if (status === 'published') {
      workflow.publisherId = userId;
      workflow.publishedAt = new Date();
      article.publishedAt = new Date();
    }

    this.workflows.set(id, workflow);

    // Trigger notifications
    this.notifyStatusChange(article, previousStatus, status, userId);

    return article;
  }

  /**
   * Increment article views
   */
  incrementViews(id: string): void {
    const article = this.articles.get(id);
    if (article) {
      article.views++;
    }
  }

  /**
   * Get article versions
   */
  getArticleVersions(id: string): ArticleVersion[] {
    return this.articleVersions.get(id) || [];
  }

  /**
   * Restore article version
   */
  async restoreVersion(id: string, version: number, userId: string): Promise<Article> {
    const versions = this.articleVersions.get(id);

    if (!versions) {
      throw new Error('No versions found');
    }

    const targetVersion = versions.find(v => v.version === version);

    if (!targetVersion) {
      throw new Error('Version not found');
    }

    return this.updateArticle(id, { content: targetVersion.content }, userId);
  }

  /**
   * Create category
   */
  createCategory(data: {
    name: string;
    description: string;
    parentId?: string;
  }): Category {
    const category: Category = {
      id: this.generateId(),
      name: data.name,
      slug: this.generateSlug(data.name),
      description: data.description,
      parentId: data.parentId,
      articleCount: 0,
      createdAt: new Date()
    };

    this.categories.set(category.id, category);
    return category;
  }

  /**
   * Get all categories
   */
  getCategories(): Category[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get category by ID
   */
  getCategory(id: string): Category | null {
    return this.categories.get(id) || null;
  }

  /**
   * Get popular tags
   */
  getPopularTags(limit: number = 20): { tag: string; count: number }[] {
    const tagCounts = new Map<string, number>();

    for (const article of this.articles.values()) {
      if (article.status === 'published') {
        article.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    }

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Save article version
   */
  private saveVersion(articleId: string, content: string, userId: string): void {
    const versions = this.articleVersions.get(articleId) || [];

    const version: ArticleVersion = {
      version: versions.length + 1,
      content,
      createdAt: new Date(),
      createdBy: userId
    };

    versions.push(version);
    this.articleVersions.set(articleId, versions);

    // Keep only last 10 versions
    if (versions.length > 10) {
      versions.shift();
    }
  }

  /**
   * Render markdown to HTML
   */
  private async renderMarkdown(markdown: string): Promise<string> {
    // In a real implementation, this would use the marked library
    // For this showcase, we'll simulate the conversion
    return `<div class="markdown-content">${this.escapeHtml(markdown)}</div>`;
  }

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Calculate reading time
   */
  private calculateReadingTime(content: string, wpm: number = 200): number {
    const words = this.countWords(content);
    return Math.ceil(words / wpm);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return text.replace(/[&<>"']/g, char => htmlEntities[char]);
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(
    article: Article,
    fromStatus: Article['status'],
    toStatus: Article['status'],
    userId: string
  ): void {
    // In a real implementation, this would trigger email notifications
    // via the Ruby worker service
    console.log(`Article "${article.title}" status changed: ${fromStatus} → ${toStatus} by ${userId}`);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

// Export singleton instance
export const contentManager = new ContentManager();
