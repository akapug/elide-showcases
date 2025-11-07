/**
 * CMS Platform - Admin Application
 *
 * Main admin dashboard application for content management system.
 * Provides UI for managing articles, media, users, and settings.
 */

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'author';
  createdAt: Date;
  lastLogin: Date;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'review' | 'published';
  author: User;
  categories: Category[];
  tags: string[];
  featuredImage?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  comments: Comment[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent?: Category;
  articleCount: number;
}

interface Comment {
  id: string;
  articleId: string;
  author: string;
  email: string;
  content: string;
  status: 'pending' | 'approved' | 'spam';
  createdAt: Date;
  parentId?: string;
}

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  alt?: string;
  caption?: string;
  uploadedBy: User;
  uploadedAt: Date;
  folder?: string;
}

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalComments: number;
  pendingComments: number;
  totalUsers: number;
  recentArticles: Article[];
  popularArticles: Article[];
}

/**
 * Admin Application Manager
 */
export class AdminApp {
  private currentUser: User | null = null;
  private apiBaseUrl: string;
  private authToken: string | null = null;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.loadAuthToken();
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    try {
      await this.validateSession();
      this.setupEventListeners();
      this.loadDashboard();
    } catch (error) {
      console.error('Failed to initialize admin app:', error);
      this.redirectToLogin();
    }
  }

  /**
   * Load authentication token from storage
   */
  private loadAuthToken(): void {
    if (typeof localStorage !== 'undefined') {
      this.authToken = localStorage.getItem('cms_auth_token');
    }
  }

  /**
   * Save authentication token to storage
   */
  private saveAuthToken(token: string): void {
    this.authToken = token;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cms_auth_token', token);
    }
  }

  /**
   * Clear authentication token
   */
  private clearAuthToken(): void {
    this.authToken = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cms_auth_token');
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<User> {
    const response = await this.apiRequest('/auth/validate', {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Session validation failed');
    }

    const data = await response.json();
    this.currentUser = data.user;
    return this.currentUser!;
  }

  /**
   * User login
   */
  async login(username: string, password: string): Promise<User> {
    const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.saveAuthToken(data.token);
    this.currentUser = data.user;
    return this.currentUser!;
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      await this.apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuthToken();
      this.currentUser = null;
      this.redirectToLogin();
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});

    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    return fetch(`${this.apiBaseUrl}${endpoint}`, {
      ...options,
      headers
    });
  }

  /**
   * Load dashboard data
   */
  async loadDashboard(): Promise<DashboardStats> {
    const response = await this.apiRequest('/dashboard/stats');

    if (!response.ok) {
      throw new Error('Failed to load dashboard');
    }

    return response.json();
  }

  /**
   * Get articles list
   */
  async getArticles(filters?: {
    status?: string;
    category?: string;
    author?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ articles: Article[]; total: number; page: number; pages: number }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      });
    }

    const response = await this.apiRequest(`/articles?${params}`);

    if (!response.ok) {
      throw new Error('Failed to load articles');
    }

    return response.json();
  }

  /**
   * Get single article
   */
  async getArticle(id: string): Promise<Article> {
    const response = await this.apiRequest(`/articles/${id}`);

    if (!response.ok) {
      throw new Error('Failed to load article');
    }

    return response.json();
  }

  /**
   * Create new article
   */
  async createArticle(article: Partial<Article>): Promise<Article> {
    const response = await this.apiRequest('/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(article)
    });

    if (!response.ok) {
      throw new Error('Failed to create article');
    }

    return response.json();
  }

  /**
   * Update article
   */
  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    const response = await this.apiRequest(`/articles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update article');
    }

    return response.json();
  }

  /**
   * Delete article
   */
  async deleteArticle(id: string): Promise<void> {
    const response = await this.apiRequest(`/articles/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete article');
    }
  }

  /**
   * Change article status
   */
  async changeArticleStatus(id: string, status: Article['status']): Promise<Article> {
    const response = await this.apiRequest(`/articles/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to change article status');
    }

    return response.json();
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await this.apiRequest('/categories');

    if (!response.ok) {
      throw new Error('Failed to load categories');
    }

    return response.json();
  }

  /**
   * Create category
   */
  async createCategory(category: Partial<Category>): Promise<Category> {
    const response = await this.apiRequest('/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(category)
    });

    if (!response.ok) {
      throw new Error('Failed to create category');
    }

    return response.json();
  }

  /**
   * Get comments
   */
  async getComments(filters?: {
    status?: string;
    articleId?: string;
  }): Promise<Comment[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      });
    }

    const response = await this.apiRequest(`/comments?${params}`);

    if (!response.ok) {
      throw new Error('Failed to load comments');
    }

    return response.json();
  }

  /**
   * Update comment status
   */
  async updateCommentStatus(id: string, status: Comment['status']): Promise<Comment> {
    const response = await this.apiRequest(`/comments/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update comment status');
    }

    return response.json();
  }

  /**
   * Get media items
   */
  async getMediaItems(folder?: string): Promise<MediaItem[]> {
    const params = new URLSearchParams();
    if (folder) {
      params.set('folder', folder);
    }

    const response = await this.apiRequest(`/media?${params}`);

    if (!response.ok) {
      throw new Error('Failed to load media items');
    }

    return response.json();
  }

  /**
   * Upload media file
   */
  async uploadMedia(file: File, metadata?: {
    alt?: string;
    caption?: string;
    folder?: string;
  }): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value);
        }
      });
    }

    const headers = new Headers();
    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await fetch(`${this.apiBaseUrl}/media/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    return response.json();
  }

  /**
   * Delete media item
   */
  async deleteMedia(id: string): Promise<void> {
    const response = await this.apiRequest(`/media/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete media');
    }
  }

  /**
   * Get users
   */
  async getUsers(): Promise<User[]> {
    const response = await this.apiRequest('/users');

    if (!response.ok) {
      throw new Error('Failed to load users');
    }

    return response.json();
  }

  /**
   * Create user
   */
  async createUser(user: {
    username: string;
    email: string;
    password: string;
    role: User['role'];
  }): Promise<User> {
    const response = await this.apiRequest('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return response.json();
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await this.apiRequest(`/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return response.json();
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const response = await this.apiRequest(`/users/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Search content
   */
  async search(query: string, filters?: {
    type?: 'article' | 'media' | 'user';
    limit?: number;
  }): Promise<{
    articles: Article[];
    media: MediaItem[];
    total: number;
  }> {
    const params = new URLSearchParams({ q: query });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      });
    }

    const response = await this.apiRequest(`/search?${params}`);

    if (!response.ok) {
      throw new Error('Search failed');
    }

    return response.json();
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    const rolePermissions: Record<string, string[]> = {
      admin: ['*'],
      editor: ['articles:read', 'articles:write', 'articles:publish', 'media:read', 'media:write', 'comments:moderate'],
      author: ['articles:read', 'articles:write', 'media:read']
    };

    const userPermissions = rolePermissions[this.currentUser.role] || [];

    return userPermissions.includes('*') || userPermissions.includes(permission);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for authentication errors
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('authentication')) {
        this.handleAuthError();
      }
    });
  }

  /**
   * Handle authentication error
   */
  private handleAuthError(): void {
    this.clearAuthToken();
    this.currentUser = null;
    this.redirectToLogin();
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }
}

// Export singleton instance
export const adminApp = new AdminApp();
