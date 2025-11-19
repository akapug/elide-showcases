/**
 * Prometheus Pushgateway Client
 *
 * Push metrics to Prometheus Pushgateway
 */

import type {
  PushgatewayConfiguration,
  PushgatewayOptions,
  LabelValues,
} from './types';
import { register as defaultRegistry } from './registry';

/**
 * Pushgateway client
 */
export class Pushgateway {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly headers: Record<string, string>;

  constructor(url: string, config: PushgatewayConfiguration = {}) {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 5000;
    this.headers = {
      'Content-Type': 'text/plain; charset=utf-8',
      ...config.headers,
    };

    // Add basic auth if provided
    if (config.auth) {
      const credentials = Buffer.from(
        `${config.auth.username}:${config.auth.password}`
      ).toString('base64');
      this.headers['Authorization'] = `Basic ${credentials}`;
    }
  }

  /**
   * Push metrics (replace all metrics for job/instance)
   */
  async push(options: PushgatewayOptions): Promise<void> {
    const url = this.buildUrl(options.jobName, options.groupings);
    const registry = options.registry || defaultRegistry;
    const metrics = await registry.metrics();

    await this.request('PUT', url, metrics);
  }

  /**
   * Push metrics (add to existing metrics)
   */
  async pushAdd(options: PushgatewayOptions): Promise<void> {
    const url = this.buildUrl(options.jobName, options.groupings);
    const registry = options.registry || defaultRegistry;
    const metrics = await registry.metrics();

    await this.request('POST', url, metrics);
  }

  /**
   * Delete metrics for job/instance
   */
  async delete(options: PushgatewayOptions): Promise<void> {
    const url = this.buildUrl(options.jobName, options.groupings);
    await this.request('DELETE', url);
  }

  /**
   * Build Pushgateway URL
   */
  private buildUrl(jobName: string, groupings?: LabelValues): string {
    let url = `${this.baseUrl}/metrics/job/${encodeURIComponent(jobName)}`;

    if (groupings) {
      for (const [key, value] of Object.entries(groupings)) {
        if (value !== undefined && value !== null) {
          url += `/${encodeURIComponent(key)}/${encodeURIComponent(String(value))}`;
        }
      }
    }

    return url;
  }

  /**
   * Make HTTP request
   */
  private async request(
    method: string,
    url: string,
    body?: string
  ): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Pushgateway request failed: ${response.status} ${response.statusText}\n${text}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Pushgateway request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error during Pushgateway request');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Create a Pushgateway client
 */
export function createPushgateway(
  url: string,
  config?: PushgatewayConfiguration
): Pushgateway {
  return new Pushgateway(url, config);
}
