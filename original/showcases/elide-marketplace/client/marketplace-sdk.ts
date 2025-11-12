/**
 * Elide Marketplace SDK
 *
 * TypeScript SDK for interacting with the Elide Marketplace API
 */

export interface MarketplaceConfig {
  apiUrl?: string;
  registryUrl?: string;
  marketplaceUrl?: string;
  apiToken?: string;
}

export interface PackageSearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

export interface ServiceDeploymentConfig {
  serviceId: string;
  name: string;
  config: {
    tier: string;
    region: string;
    [key: string]: any;
  };
}

export interface WebhookConfig {
  url: string;
  events: string[];
}

/**
 * Main SDK class
 */
export class MarketplaceSDK {
  private config: Required<MarketplaceConfig>;

  constructor(config: MarketplaceConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || "http://localhost:3000",
      registryUrl: config.registryUrl || "http://localhost:4873",
      marketplaceUrl: config.marketplaceUrl || "http://localhost:3001",
      apiToken: config.apiToken || ""
    };
  }

  /**
   * Set API token for authentication
   */
  setApiToken(token: string): void {
    this.config.apiToken = token;
  }

  /**
   * Make authenticated request
   */
  private async request(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = new Headers(options.headers || {});

    if (this.config.apiToken) {
      headers.set("Authorization", `Bearer ${this.config.apiToken}`);
    }

    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return response;
  }

  // Authentication Methods

  /**
   * Register a new user
   */
  async register(username: string, email: string, password: string): Promise<any> {
    const response = await this.request(`${this.config.apiUrl}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    this.config.apiToken = data.token;
    return data;
  }

  /**
   * Login to marketplace
   */
  async login(username: string, password: string): Promise<any> {
    const response = await this.request(`${this.config.apiUrl}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    this.config.apiToken = data.token;
    return data;
  }

  // Package Methods

  /**
   * Search for packages
   */
  async searchPackages(options: PackageSearchOptions = {}): Promise<any> {
    const params = new URLSearchParams();
    if (options.query) params.set("q", options.query);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());

    const response = await this.request(
      `${this.config.apiUrl}/api/packages/search?${params}`
    );

    return await response.json();
  }

  /**
   * Get package details
   */
  async getPackage(name: string): Promise<any> {
    const response = await this.request(
      `${this.config.apiUrl}/api/packages/${encodeURIComponent(name)}`
    );

    return await response.json();
  }

  /**
   * Publish a package
   */
  async publishPackage(packageData: any): Promise<any> {
    const response = await this.request(`${this.config.apiUrl}/api/packages`, {
      method: "POST",
      body: JSON.stringify(packageData)
    });

    return await response.json();
  }

  /**
   * Get package download URL
   */
  getPackageDownloadUrl(name: string, version: string): string {
    return `${this.config.apiUrl}/api/packages/${encodeURIComponent(name)}/${version}/download`;
  }

  // Service Methods

  /**
   * List available services
   */
  async listServices(category?: string): Promise<any> {
    const params = new URLSearchParams();
    if (category) params.set("category", category);

    const response = await this.request(
      `${this.config.marketplaceUrl}/api/services?${params}`
    );

    return await response.json();
  }

  /**
   * Get service details
   */
  async getService(slug: string): Promise<any> {
    const response = await this.request(
      `${this.config.marketplaceUrl}/api/services/${slug}`
    );

    return await response.json();
  }

  /**
   * Deploy a service
   */
  async deployService(config: ServiceDeploymentConfig): Promise<any> {
    const response = await this.request(
      `${this.config.marketplaceUrl}/api/deployments`,
      {
        method: "POST",
        body: JSON.stringify(config)
      }
    );

    return await response.json();
  }

  /**
   * List user's deployments
   */
  async listDeployments(): Promise<any> {
    const response = await this.request(
      `${this.config.marketplaceUrl}/api/deployments`
    );

    return await response.json();
  }

  /**
   * Get deployment status
   */
  async getDeployment(id: string): Promise<any> {
    const response = await this.request(
      `${this.config.marketplaceUrl}/api/deployments/${id}`
    );

    return await response.json();
  }

  /**
   * Stop a deployment
   */
  async stopDeployment(id: string): Promise<any> {
    const response = await this.request(
      `${this.config.marketplaceUrl}/api/deployments/${id}/stop`,
      {
        method: "POST"
      }
    );

    return await response.json();
  }

  /**
   * Rate a service
   */
  async rateService(serviceId: string, rating: number, review?: string): Promise<any> {
    const response = await this.request(
      `${this.config.marketplaceUrl}/api/services/${serviceId}/reviews`,
      {
        method: "POST",
        body: JSON.stringify({ rating, review })
      }
    );

    return await response.json();
  }

  // Analytics Methods

  /**
   * Get analytics data
   */
  async getAnalytics(options: {
    type?: string;
    id?: string;
    days?: number;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (options.type) params.set("type", options.type);
    if (options.id) params.set("id", options.id);
    if (options.days) params.set("days", options.days.toString());

    const response = await this.request(
      `${this.config.apiUrl}/api/analytics?${params}`
    );

    return await response.json();
  }

  // Webhook Methods

  /**
   * Create a webhook
   */
  async createWebhook(config: WebhookConfig): Promise<any> {
    const response = await this.request(`${this.config.apiUrl}/api/webhooks`, {
      method: "POST",
      body: JSON.stringify(config)
    });

    return await response.json();
  }

  /**
   * List webhooks
   */
  async listWebhooks(): Promise<any> {
    const response = await this.request(`${this.config.apiUrl}/api/webhooks`);
    return await response.json();
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    await this.request(`${this.config.apiUrl}/api/webhooks/${id}`, {
      method: "DELETE"
    });
  }

  // Utility Methods

  /**
   * Check API health
   */
  async healthCheck(): Promise<any> {
    const response = await this.request(`${this.config.apiUrl}/health`);
    return await response.json();
  }
}

/**
 * Create SDK instance
 */
export function createMarketplaceClient(config?: MarketplaceConfig): MarketplaceSDK {
  return new MarketplaceSDK(config);
}

// Example usage
if (import.meta.main) {
  const client = createMarketplaceClient();

  // Example: Search for packages
  const packages = await client.searchPackages({ query: "elide" });
  console.log("Found packages:", packages.results.length);

  // Example: List services
  const services = await client.listServices();
  console.log("Available services:", services.services.length);

  // Example: Check health
  const health = await client.healthCheck();
  console.log("API Health:", health.status);
}
