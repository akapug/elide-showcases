/**
 * HTTP Client
 *
 * Simple HTTP client with interceptors and error handling
 */

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
}

export interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor = <T>(response: Response<T>) => Response<T> | Promise<Response<T>>;
export type ErrorInterceptor = (error: Error) => Error | Promise<Error>;

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(baseURL = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Make HTTP request
   */
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T>> {
    try {
      // Apply request interceptors
      let requestConfig = config;
      for (const interceptor of this.requestInterceptors) {
        requestConfig = await interceptor(requestConfig);
      }

      // Build full URL
      const fullURL = this.buildURL(url);

      // Build fetch options
      const fetchOptions: RequestInit = {
        method: requestConfig.method || 'GET',
        headers: {
          ...this.defaultHeaders,
          ...requestConfig.headers,
        },
        credentials: requestConfig.credentials,
        signal: requestConfig.signal,
      };

      // Add body if present
      if (requestConfig.body) {
        if (typeof requestConfig.body === 'object') {
          fetchOptions.body = JSON.stringify(requestConfig.body);
        } else {
          fetchOptions.body = requestConfig.body;
        }
      }

      // Make request with timeout
      const response = await this.fetchWithTimeout(fullURL, fetchOptions, requestConfig.timeout);

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as any;
      }

      // Build response object
      let result: Response<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        result = await interceptor(result);
      }

      return result;
    } catch (error) {
      // Apply error interceptors
      let finalError = error as Error;
      for (const interceptor of this.errorInterceptors) {
        finalError = await interceptor(finalError);
      }
      throw finalError;
    }
  }

  /**
   * GET request
   */
  get<T = any>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  post<T = any>(url: string, body?: any, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  /**
   * PUT request
   */
  put<T = any>(url: string, body?: any, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  delete<T = any>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  patch<T = any>(url: string, body?: any, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  /**
   * Build full URL
   */
  private buildURL(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const separator = this.baseURL.endsWith('/') || url.startsWith('/') ? '' : '/';
    return `${this.baseURL}${separator}${url}`;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout?: number,
  ): Promise<globalThis.Response> {
    if (!timeout) {
      return fetch(url, options);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

/**
 * Create HTTP client instance
 */
export function createClient(baseURL?: string, headers?: Record<string, string>): HttpClient {
  return new HttpClient(baseURL, headers);
}
