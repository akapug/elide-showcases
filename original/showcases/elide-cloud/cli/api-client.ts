/**
 * API Client for Elide Cloud CLI
 */

import type { APIResponse } from '../core/types.ts';
import type { ConfigManager } from './config.ts';

export class APIClient {
  private baseUrl: string;
  private config: ConfigManager;

  constructor(config: ConfigManager) {
    this.config = config;
    this.baseUrl = process.env.ELIDE_CLOUD_API || 'http://localhost:3000';
  }

  private async request<T = any>(
    method: string,
    path: string,
    body?: any
  ): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.config.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: any = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    return await response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<APIResponse> {
    return this.request('POST', '/auth/login', { email, password });
  }

  async getCurrentUser(): Promise<APIResponse> {
    return this.request('GET', '/auth/user');
  }

  // Applications
  async listApplications(): Promise<APIResponse> {
    return this.request('GET', '/applications');
  }

  async createApplication(data: any): Promise<APIResponse> {
    return this.request('POST', '/applications', data);
  }

  async getApplication(id: string): Promise<APIResponse> {
    return this.request('GET', `/applications/${id}`);
  }

  async updateApplication(id: string, data: any): Promise<APIResponse> {
    return this.request('PATCH', `/applications/${id}`, data);
  }

  async deleteApplication(id: string): Promise<APIResponse> {
    return this.request('DELETE', `/applications/${id}`);
  }

  // Deployments
  async listDeployments(appId: string): Promise<APIResponse> {
    return this.request('GET', `/applications/${appId}/deployments`);
  }

  async createDeployment(appId: string, data: any): Promise<APIResponse> {
    return this.request('POST', `/applications/${appId}/deployments`, data);
  }

  async getDeployment(id: string): Promise<APIResponse> {
    return this.request('GET', `/deployments/${id}`);
  }

  async rollbackDeployment(id: string): Promise<APIResponse> {
    return this.request('POST', `/deployments/${id}/rollback`);
  }

  // Config Vars
  async listConfigVars(appId: string): Promise<APIResponse> {
    return this.request('GET', `/applications/${appId}/env`);
  }

  async setConfigVar(appId: string, key: string, value: string): Promise<APIResponse> {
    return this.request('POST', `/applications/${appId}/env`, { key, value });
  }

  async deleteConfigVar(appId: string, key: string): Promise<APIResponse> {
    return this.request('DELETE', `/applications/${appId}/env/${key}`);
  }

  // Domains
  async listDomains(appId: string): Promise<APIResponse> {
    return this.request('GET', `/applications/${appId}/domains`);
  }

  async addDomain(appId: string, hostname: string): Promise<APIResponse> {
    return this.request('POST', `/applications/${appId}/domains`, { hostname });
  }

  async deleteDomain(appId: string, domainId: string): Promise<APIResponse> {
    return this.request('DELETE', `/applications/${appId}/domains/${domainId}`);
  }

  // Add-ons
  async listAddons(appId: string): Promise<APIResponse> {
    return this.request('GET', `/applications/${appId}/addons`);
  }

  async provisionAddon(appId: string, provider: string, plan: string): Promise<APIResponse> {
    return this.request('POST', `/applications/${appId}/addons`, { provider, plan });
  }

  async deprovisionAddon(addonId: string): Promise<APIResponse> {
    return this.request('DELETE', `/addons/${addonId}`);
  }

  // Processes
  async listProcesses(appId: string): Promise<APIResponse> {
    return this.request('GET', `/applications/${appId}/processes`);
  }

  async scaleApplication(appId: string, data: any): Promise<APIResponse> {
    return this.request('POST', `/applications/${appId}/scale`, data);
  }

  async restartApplication(appId: string): Promise<APIResponse> {
    return this.request('POST', `/applications/${appId}/restart`);
  }

  // Logs
  async getLogs(appId: string, tail: number): Promise<APIResponse> {
    return this.request('GET', `/applications/${appId}/logs?tail=${tail}`);
  }
}
