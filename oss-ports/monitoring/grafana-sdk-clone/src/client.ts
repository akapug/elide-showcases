/**
 * Grafana API Client
 */

import type {
  GrafanaClientOptions,
  DashboardCreateOptions,
  DashboardCreateResult,
  DashboardSearchOptions,
  FolderOptions,
  DatasourceConfig,
  DashboardPermission,
} from './types';
import { Dashboard } from './dashboard';

/**
 * Grafana API Client
 */
export class GrafanaClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeout: number;

  constructor(options: GrafanaClientOptions) {
    this.baseUrl = options.url.replace(/\/$/, '');
    this.timeout = options.timeout || 30000;

    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // Add authentication
    if (options.apiKey) {
      this.headers['Authorization'] = `Bearer ${options.apiKey}`;
    } else if (options.token) {
      this.headers['Authorization'] = `Bearer ${options.token}`;
    } else if (options.auth) {
      const credentials = Buffer.from(
        `${options.auth.username}:${options.auth.password}`
      ).toString('base64');
      this.headers['Authorization'] = `Basic ${credentials}`;
    }
  }

  /**
   * Create a dashboard
   */
  async createDashboard(
    dashboard: Dashboard,
    options: DashboardCreateOptions = {}
  ): Promise<DashboardCreateResult> {
    const payload: any = {
      dashboard: dashboard.toJSON(),
      overwrite: options.overwrite || false,
      message: options.message || '',
    };

    if (options.folderId !== undefined) {
      payload.folderId = options.folderId;
    } else if (options.folder) {
      // Resolve folder name to ID
      const folders = await this.getFolders();
      const folder = folders.find((f: any) => f.title === options.folder);
      if (folder) {
        payload.folderId = folder.id;
      }
    }

    const response = await this.request('POST', '/api/dashboards/db', payload);
    return response as DashboardCreateResult;
  }

  /**
   * Get a dashboard by UID
   */
  async getDashboard(uid: string): Promise<Dashboard> {
    const response = await this.request('GET', `/api/dashboards/uid/${uid}`);
    return Dashboard.fromJSON(response.dashboard);
  }

  /**
   * Get a dashboard by ID
   */
  async getDashboardById(id: number): Promise<Dashboard> {
    const response = await this.request('GET', `/api/dashboards/id/${id}`);
    return Dashboard.fromJSON(response.dashboard);
  }

  /**
   * Update a dashboard
   */
  async updateDashboard(
    dashboard: Dashboard,
    options: DashboardCreateOptions = {}
  ): Promise<DashboardCreateResult> {
    return this.createDashboard(dashboard, { ...options, overwrite: true });
  }

  /**
   * Delete a dashboard by UID
   */
  async deleteDashboard(uid: string): Promise<void> {
    await this.request('DELETE', `/api/dashboards/uid/${uid}`);
  }

  /**
   * Search dashboards
   */
  async searchDashboards(
    options: DashboardSearchOptions = {}
  ): Promise<any[]> {
    const params = new URLSearchParams();

    if (options.query) params.append('query', options.query);
    if (options.tags) params.append('tag', options.tags.join(','));
    if (options.type) params.append('type', options.type);
    if (options.dashboardIds)
      params.append('dashboardIds', options.dashboardIds.join(','));
    if (options.folderIds)
      params.append('folderIds', options.folderIds.join(','));
    if (options.starred) params.append('starred', 'true');
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.page) params.append('page', options.page.toString());

    const queryString = params.toString();
    const url = queryString ? `/api/search?${queryString}` : '/api/search';

    return this.request('GET', url) as Promise<any[]>;
  }

  /**
   * Create a folder
   */
  async createFolder(options: FolderOptions): Promise<any> {
    return this.request('POST', '/api/folders', options);
  }

  /**
   * Get all folders
   */
  async getFolders(): Promise<any[]> {
    return this.request('GET', '/api/folders') as Promise<any[]>;
  }

  /**
   * Get a folder by UID
   */
  async getFolder(uid: string): Promise<any> {
    return this.request('GET', `/api/folders/${uid}`);
  }

  /**
   * Update a folder
   */
  async updateFolder(uid: string, options: FolderOptions): Promise<any> {
    return this.request('PUT', `/api/folders/${uid}`, options);
  }

  /**
   * Delete a folder
   */
  async deleteFolder(uid: string): Promise<void> {
    await this.request('DELETE', `/api/folders/${uid}`);
  }

  /**
   * Create a data source
   */
  async createDatasource(config: DatasourceConfig): Promise<any> {
    return this.request('POST', '/api/datasources', config);
  }

  /**
   * Get all data sources
   */
  async getDatasources(): Promise<any[]> {
    return this.request('GET', '/api/datasources') as Promise<any[]>;
  }

  /**
   * Get a data source by ID
   */
  async getDatasource(id: number): Promise<any> {
    return this.request('GET', `/api/datasources/${id}`);
  }

  /**
   * Get a data source by name
   */
  async getDatasourceByName(name: string): Promise<any> {
    return this.request('GET', `/api/datasources/name/${encodeURIComponent(name)}`);
  }

  /**
   * Update a data source
   */
  async updateDatasource(
    id: number,
    config: Partial<DatasourceConfig>
  ): Promise<any> {
    return this.request('PUT', `/api/datasources/${id}`, config);
  }

  /**
   * Delete a data source
   */
  async deleteDatasource(id: number): Promise<void> {
    await this.request('DELETE', `/api/datasources/${id}`);
  }

  /**
   * Test a data source
   */
  async testDatasource(config: DatasourceConfig): Promise<any> {
    const datasource = await this.createDatasource(config);
    const result = await this.request(
      'POST',
      `/api/datasources/${datasource.id}/test`
    );
    return result;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any> {
    return this.request('GET', '/api/user');
  }

  /**
   * Get organizations
   */
  async getOrganizations(): Promise<any[]> {
    return this.request('GET', '/api/user/orgs') as Promise<any[]>;
  }

  /**
   * Switch organization
   */
  async switchOrganization(orgId: number): Promise<void> {
    await this.request('POST', '/api/user/using/' + orgId);
  }

  /**
   * Get users
   */
  async getUsers(): Promise<any[]> {
    return this.request('GET', '/api/users') as Promise<any[]>;
  }

  /**
   * Create a snapshot
   */
  async createSnapshot(
    dashboard: Dashboard,
    options: { name?: string; expires?: number; external?: boolean } = {}
  ): Promise<any> {
    const payload = {
      dashboard: dashboard.toJSON(),
      name: options.name || dashboard.title,
      expires: options.expires || 0,
      external: options.external || false,
    };

    return this.request('POST', '/api/snapshots', payload);
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(key: string): Promise<void> {
    await this.request('DELETE', `/api/snapshots/${key}`);
  }

  /**
   * Get dashboard permissions
   */
  async getDashboardPermissions(uid: string): Promise<DashboardPermission[]> {
    return this.request(
      'GET',
      `/api/dashboards/uid/${uid}/permissions`
    ) as Promise<DashboardPermission[]>;
  }

  /**
   * Set dashboard permissions
   */
  async setDashboardPermissions(
    uid: string,
    permissions: DashboardPermission[]
  ): Promise<void> {
    await this.request('POST', `/api/dashboards/uid/${uid}/permissions`, {
      items: permissions,
    });
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<any> {
    return this.request('GET', '/api/health');
  }

  /**
   * Get Grafana version
   */
  async getVersion(): Promise<any> {
    return this.request('GET', '/api/frontend/settings');
  }

  /**
   * Execute annotations query
   */
  async queryAnnotations(options: {
    dashboardId?: number;
    panelId?: number;
    from: number;
    to: number;
    tags?: string[];
  }): Promise<any[]> {
    const params = new URLSearchParams({
      from: options.from.toString(),
      to: options.to.toString(),
    });

    if (options.dashboardId)
      params.append('dashboardId', options.dashboardId.toString());
    if (options.panelId)
      params.append('panelId', options.panelId.toString());
    if (options.tags) params.append('tags', options.tags.join(','));

    return this.request(
      'GET',
      `/api/annotations?${params.toString()}`
    ) as Promise<any[]>;
  }

  /**
   * Create an annotation
   */
  async createAnnotation(annotation: {
    dashboardId?: number;
    panelId?: number;
    time: number;
    timeEnd?: number;
    tags?: string[];
    text: string;
  }): Promise<any> {
    return this.request('POST', '/api/annotations', annotation);
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(id: number): Promise<void> {
    await this.request('DELETE', `/api/annotations/${id}`);
  }

  /**
   * Make HTTP request
   */
  private async request(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Grafana API request failed: ${response.status} ${response.statusText}\n${text}`
        );
      }

      // Handle no content responses
      if (response.status === 204 || response.status === 200) {
        const text = await response.text();
        if (!text) return {};
        try {
          return JSON.parse(text);
        } catch {
          return {};
        }
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Grafana API request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error during Grafana API request');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Create a Grafana client
 */
export function createClient(options: GrafanaClientOptions): GrafanaClient {
  return new GrafanaClient(options);
}
