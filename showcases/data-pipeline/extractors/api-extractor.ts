/**
 * API Extractor
 *
 * Extracts data from REST APIs with pagination, authentication, and retry support.
 */

import { PipelineContext } from '../orchestrator/pipeline';

// API extractor configuration
export interface ApiExtractorConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  params?: Record<string, any>;
  body?: any;
  pagination?: {
    type: 'offset' | 'cursor' | 'page';
    pageSize?: number;
    maxPages?: number;
    offsetParam?: string;
    limitParam?: string;
    pageParam?: string;
    cursorParam?: string;
    cursorPath?: string;
  };
  timeout?: number;
  retries?: number;
  dataPath?: string; // JSON path to extract data from response
  rateLimit?: {
    requestsPerSecond: number;
  };
}

/**
 * API Extractor
 */
export class ApiExtractor {
  private lastRequestTime: number = 0;

  /**
   * Extract data from API
   */
  async extract(config: ApiExtractorConfig, context: PipelineContext): Promise<any[]> {
    console.log(`[${context.runId}] Extracting from API: ${config.url}`);

    const allData: any[] = [];

    if (config.pagination) {
      // Extract with pagination
      const pages = await this.extractWithPagination(config, context);
      allData.push(...pages.flat());
    } else {
      // Single request
      const data = await this.makeRequest(config, {}, context);
      const extracted = this.extractDataFromResponse(data, config.dataPath);
      allData.push(...extracted);
    }

    console.log(`[${context.runId}] Extracted ${allData.length} records from API`);

    return allData;
  }

  /**
   * Extract data with pagination
   */
  private async extractWithPagination(
    config: ApiExtractorConfig,
    context: PipelineContext
  ): Promise<any[][]> {
    const pagination = config.pagination!;
    const allPages: any[][] = [];

    let pageNumber = 0;
    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore && pageNumber < (pagination.maxPages || 1000)) {
      const params = this.buildPaginationParams(
        config.params || {},
        pagination,
        pageNumber,
        cursor
      );

      const data = await this.makeRequest(
        { ...config, params },
        { page: pageNumber },
        context
      );

      const extracted = this.extractDataFromResponse(data, config.dataPath);

      if (extracted.length === 0) {
        hasMore = false;
        break;
      }

      allPages.push(extracted);
      pageNumber++;

      // Update cursor for cursor-based pagination
      if (pagination.type === 'cursor' && pagination.cursorPath) {
        cursor = this.extractCursor(data, pagination.cursorPath);
        hasMore = cursor !== undefined && cursor !== null;
      } else if (pagination.type === 'page' || pagination.type === 'offset') {
        // Check if we got a full page
        hasMore = extracted.length >= (pagination.pageSize || 100);
      }

      console.log(
        `[${context.runId}] Page ${pageNumber}: ${extracted.length} records (hasMore: ${hasMore})`
      );
    }

    return allPages;
  }

  /**
   * Build pagination parameters
   */
  private buildPaginationParams(
    baseParams: Record<string, any>,
    pagination: NonNullable<ApiExtractorConfig['pagination']>,
    pageNumber: number,
    cursor?: string
  ): Record<string, any> {
    const params = { ...baseParams };

    switch (pagination.type) {
      case 'offset':
        params[pagination.offsetParam || 'offset'] = pageNumber * (pagination.pageSize || 100);
        params[pagination.limitParam || 'limit'] = pagination.pageSize || 100;
        break;

      case 'page':
        params[pagination.pageParam || 'page'] = pageNumber + 1; // 1-indexed
        params[pagination.limitParam || 'limit'] = pagination.pageSize || 100;
        break;

      case 'cursor':
        if (cursor) {
          params[pagination.cursorParam || 'cursor'] = cursor;
        }
        params[pagination.limitParam || 'limit'] = pagination.pageSize || 100;
        break;
    }

    return params;
  }

  /**
   * Make HTTP request
   */
  private async makeRequest(
    config: ApiExtractorConfig,
    metadata: Record<string, any>,
    context: PipelineContext
  ): Promise<any> {
    // Apply rate limiting
    if (config.rateLimit) {
      await this.applyRateLimit(config.rateLimit);
    }

    const url = this.buildUrl(config.url, config.params || {});
    const headers = this.buildHeaders(config);

    const options: RequestInit = {
      method: config.method || 'GET',
      headers,
      signal: this.createTimeoutSignal(config.timeout || 30000)
    };

    if (config.body && (config.method === 'POST' || config.method === 'PUT')) {
      options.body = JSON.stringify(config.body);
    }

    const maxRetries = config.retries || 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text();
        }

      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          const backoff = Math.pow(2, attempt) * 1000;
          console.warn(
            `[${context.runId}] Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${backoff}ms...`
          );
          await this.sleep(backoff);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(baseUrl: string, params: Record<string, any>): string {
    const url = new URL(baseUrl);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }

    return url.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(config: ApiExtractorConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    };

    // Add authentication headers
    if (config.auth) {
      switch (config.auth.type) {
        case 'bearer':
          if (config.auth.token) {
            headers['Authorization'] = `Bearer ${config.auth.token}`;
          }
          break;

        case 'basic':
          if (config.auth.username && config.auth.password) {
            const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;

        case 'apikey':
          if (config.auth.apiKey) {
            const headerName = config.auth.apiKeyHeader || 'X-API-Key';
            headers[headerName] = config.auth.apiKey;
          }
          break;
      }
    }

    return headers;
  }

  /**
   * Extract data from response using JSON path
   */
  private extractDataFromResponse(response: any, dataPath?: string): any[] {
    if (!dataPath) {
      return Array.isArray(response) ? response : [response];
    }

    const parts = dataPath.split('.');
    let current = response;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return [];
      }
      current = current[part];
    }

    return Array.isArray(current) ? current : [current];
  }

  /**
   * Extract cursor from response
   */
  private extractCursor(response: any, cursorPath: string): string | undefined {
    const parts = cursorPath.split('.');
    let current = response;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(rateLimit: { requestsPerSecond: number }): Promise<void> {
    const minInterval = 1000 / rateLimit.requestsPerSecond;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < minInterval) {
      await this.sleep(minInterval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Create abort signal with timeout
   */
  private createTimeoutSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
