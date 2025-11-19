/**
 * Content Management API
 *
 * Handles CRUD operations for all content types (articles, pages, media)
 * Features:
 * - Content versioning with full history
 * - Multi-user collaboration
 * - Draft/Published workflow
 * - Content relationships
 * - Metadata management
 */

export interface Content {
  id: string;
  type: 'article' | 'page' | 'media';
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  author: string;
  authorName: string;
  tags: string[];
  categories: string[];
  metadata: Record<string, any>;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  data: Partial<Content>;
  changedBy: string;
  changedAt: Date;
  changeDescription?: string;
}

export interface ContentFilter {
  type?: string;
  status?: string;
  author?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContentStats {
  totalContent: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: number;
}

export class ContentAPI {
  private content: Map<string, Content> = new Map();
  private versions: Map<string, ContentVersion[]> = new Map();
  private slugIndex: Map<string, string> = new Map();

  constructor() {
    this.initializeContent();
  }

  private initializeContent(): void {
    console.log('📝 Content API initialized');
  }

  /**
   * Create new content
   */
  createContent(type: 'article' | 'page' | 'media', data: Partial<Content>): Content {
    const id = this.generateId();
    const slug = this.generateSlug(data.title || 'untitled');

    const content: Content = {
      id,
      type,
      title: data.title || 'Untitled',
      slug,
      content: data.content || '',
      excerpt: data.excerpt,
      status: data.status || 'draft',
      author: data.author || 'anonymous',
      authorName: data.authorName || 'Anonymous',
      tags: data.tags || [],
      categories: data.categories || [],
      metadata: data.metadata || {},
      featuredImage: data.featuredImage,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || data.excerpt,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    if (content.status === 'published') {
      content.publishedAt = new Date();
    }

    this.content.set(id, content);
    this.slugIndex.set(slug, id);

    // Create initial version
    this.createVersion(id, content, content.author, 'Initial creation');

    return content;
  }

  /**
   * Get content by ID
   */
  getContent(id: string): Content | null {
    return this.content.get(id) || null;
  }

  /**
   * Get content by slug
   */
  getContentBySlug(slug: string): Content | null {
    const id = this.slugIndex.get(slug);
    return id ? this.getContent(id) : null;
  }

  /**
   * Update content
   */
  updateContent(id: string, updates: Partial<Content>, userId: string): Content | null {
    const content = this.content.get(id);
    if (!content) return null;

    // Check authorization (simplified - in production, check proper permissions)
    if (content.author !== userId && updates.author !== userId) {
      return null;
    }

    const oldSlug = content.slug;
    const updated: Content = {
      ...content,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date(),
      version: content.version + 1
    };

    // Update slug if title changed
    if (updates.title && updates.title !== content.title) {
      const newSlug = this.generateSlug(updates.title);
      updated.slug = newSlug;
      this.slugIndex.delete(oldSlug);
      this.slugIndex.set(newSlug, id);
    }

    // Update published date if status changed to published
    if (updates.status === 'published' && content.status !== 'published') {
      updated.publishedAt = new Date();
    }

    this.content.set(id, updated);

    // Create version
    this.createVersion(id, updated, userId, 'Content updated');

    return updated;
  }

  /**
   * Delete content
   */
  deleteContent(id: string, userId: string): boolean {
    const content = this.content.get(id);
    if (!content) return false;

    // Check authorization
    if (content.author !== userId) {
      return false;
    }

    this.content.delete(id);
    this.slugIndex.delete(content.slug);
    this.versions.delete(id);

    return true;
  }

  /**
   * List content with filtering and pagination
   */
  listContent(filter: ContentFilter = {}): { items: Content[]; total: number; page: number; limit: number } {
    let items = Array.from(this.content.values());

    // Apply filters
    if (filter.type) {
      items = items.filter(c => c.type === filter.type);
    }

    if (filter.status) {
      items = items.filter(c => c.status === filter.status);
    }

    if (filter.author) {
      items = items.filter(c => c.author === filter.author);
    }

    if (filter.tags && filter.tags.length > 0) {
      items = items.filter(c => filter.tags!.some(tag => c.tags.includes(tag)));
    }

    // Sorting
    const sortBy = filter.sortBy || 'updatedAt';
    const sortOrder = filter.sortOrder || 'desc';

    items.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];

      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const total = items.length;
    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 20, 100); // Max 100 items per page
    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit
    };
  }

  /**
   * Search content by title or content
   */
  searchContent(query: string): Content[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.content.values()).filter(
      c =>
        c.title.toLowerCase().includes(lowerQuery) ||
        c.content.toLowerCase().includes(lowerQuery) ||
        c.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Create a version snapshot
   */
  private createVersion(contentId: string, content: Content, userId: string, description?: string): void {
    const versions = this.versions.get(contentId) || [];

    const version: ContentVersion = {
      id: this.generateId(),
      contentId,
      version: content.version,
      data: { ...content },
      changedBy: userId,
      changedAt: new Date(),
      changeDescription: description
    };

    versions.push(version);
    this.versions.set(contentId, versions);

    // Keep only last 50 versions
    if (versions.length > 50) {
      this.versions.set(contentId, versions.slice(-50));
    }
  }

  /**
   * Get version history for content
   */
  getVersionHistory(contentId: string): ContentVersion[] {
    return this.versions.get(contentId) || [];
  }

  /**
   * Restore content to a specific version
   */
  restoreVersion(contentId: string, versionNumber: number, userId: string): Content | null {
    const versions = this.versions.get(contentId);
    if (!versions) return null;

    const version = versions.find(v => v.version === versionNumber);
    if (!version) return null;

    const restoredContent = {
      ...version.data,
      id: contentId,
      updatedAt: new Date(),
      version: (this.content.get(contentId)?.version || 0) + 1
    } as Content;

    this.content.set(contentId, restoredContent);
    this.createVersion(contentId, restoredContent, userId, `Restored to version ${versionNumber}`);

    return restoredContent;
  }

  /**
   * Get content relationships (related content)
   */
  getRelatedContent(id: string, limit = 5): Content[] {
    const content = this.content.get(id);
    if (!content) return [];

    // Find content with matching tags
    const related = Array.from(this.content.values())
      .filter(c => c.id !== id && c.status === 'published')
      .map(c => ({
        content: c,
        score: this.calculateRelatedness(content, c)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.content);

    return related;
  }

  /**
   * Calculate relatedness score between two content items
   */
  private calculateRelatedness(a: Content, b: Content): number {
    let score = 0;

    // Same type bonus
    if (a.type === b.type) score += 2;

    // Tag matches
    const commonTags = a.tags.filter(tag => b.tags.includes(tag));
    score += commonTags.length * 3;

    // Category matches
    const commonCategories = a.categories.filter(cat => b.categories.includes(cat));
    score += commonCategories.length * 5;

    // Same author
    if (a.author === b.author) score += 1;

    return score;
  }

  /**
   * Bulk operations
   */
  bulkUpdateStatus(ids: string[], status: Content['status'], userId: string): number {
    let updated = 0;

    for (const id of ids) {
      const result = this.updateContent(id, { status }, userId);
      if (result) updated++;
    }

    return updated;
  }

  bulkDelete(ids: string[], userId: string): number {
    let deleted = 0;

    for (const id of ids) {
      if (this.deleteContent(id, userId)) deleted++;
    }

    return deleted;
  }

  /**
   * Get statistics
   */
  getStats(): ContentStats {
    const items = Array.from(this.content.values());

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    }

    // Recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = items.filter(c => c.updatedAt >= oneDayAgo).length;

    return {
      totalContent: items.length,
      byType,
      byStatus,
      recentActivity
    };
  }

  /**
   * Utility: Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility: Generate URL-friendly slug
   */
  private generateSlug(title: string): string {
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure uniqueness
    let finalSlug = slug;
    let counter = 1;

    while (this.slugIndex.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  /**
   * Export content (for backup/migration)
   */
  exportContent(): { content: Content[]; versions: ContentVersion[] } {
    return {
      content: Array.from(this.content.values()),
      versions: Array.from(this.versions.values()).flat()
    };
  }

  /**
   * Import content (for backup/migration)
   */
  importContent(data: { content: Content[]; versions: ContentVersion[] }): void {
    for (const content of data.content) {
      this.content.set(content.id, content);
      this.slugIndex.set(content.slug, content.id);
    }

    for (const version of data.versions) {
      const versions = this.versions.get(version.contentId) || [];
      versions.push(version);
      this.versions.set(version.contentId, versions);
    }
  }
}
