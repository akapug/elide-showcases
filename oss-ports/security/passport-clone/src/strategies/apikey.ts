/**
 * @elide/passport - API Key Strategy
 * API key authentication strategy
 */

import { Strategy } from './strategy';
import { StrategyOptions, Request, VerifyCallback } from '../types';

export type APIKeyVerifyFunction = (
  apiKey: string,
  done: VerifyCallback
) => void;

export interface APIKeyStrategyOptions extends StrategyOptions {
  headerName?: string;
  queryName?: string;
  prefix?: string;
}

/**
 * API key authentication strategy
 * Authenticates users using API keys from headers or query parameters
 */
export class APIKeyStrategy extends Strategy {
  private _verify: APIKeyVerifyFunction;
  private _headerName: string;
  private _queryName: string;
  private _prefix?: string;

  constructor(options: APIKeyStrategyOptions, verify: APIKeyVerifyFunction);
  constructor(verify: APIKeyVerifyFunction);
  constructor(
    optionsOrVerify: APIKeyStrategyOptions | APIKeyVerifyFunction,
    verify?: APIKeyVerifyFunction
  ) {
    let options: APIKeyStrategyOptions = {};

    if (typeof optionsOrVerify === 'function') {
      verify = optionsOrVerify;
      options = {};
    } else {
      options = optionsOrVerify;
    }

    if (!verify) {
      throw new TypeError('APIKeyStrategy requires a verify callback');
    }

    super(options.name || 'apikey');

    this._verify = verify;
    this._headerName = options.headerName || 'x-api-key';
    this._queryName = options.queryName || 'apiKey';
    this._prefix = options.prefix;
  }

  /**
   * Authenticate request based on API key
   * @param req - Request object
   */
  authenticate(req: Request, options: any = {}): void {
    let apiKey = this.extractFromHeader(req) || this.extractFromQuery(req);

    if (!apiKey) {
      return this.fail({ message: 'Missing API key' }, 401);
    }

    // Remove prefix if configured
    if (this._prefix && apiKey.startsWith(this._prefix)) {
      apiKey = apiKey.substring(this._prefix.length);
    }

    const verified = (err: Error | null, user?: any, info?: any) => {
      if (err) {
        return this.error(err);
      }

      if (!user) {
        return this.fail(info || { message: 'Invalid API key' }, 401);
      }

      this.success(user, info);
    };

    try {
      this._verify(apiKey, verified);
    } catch (ex) {
      return this.error(ex as Error);
    }
  }

  /**
   * Extract API key from header
   */
  private extractFromHeader(req: Request): string | null {
    const headerValue = req.headers[this._headerName.toLowerCase()];
    return headerValue || null;
  }

  /**
   * Extract API key from query parameter
   */
  private extractFromQuery(req: Request): string | null {
    return req.query?.[this._queryName] || null;
  }
}

/**
 * Create a new APIKeyStrategy instance
 */
export function createAPIKeyStrategy(
  options: APIKeyStrategyOptions | APIKeyVerifyFunction,
  verify?: APIKeyVerifyFunction
): APIKeyStrategy {
  if (typeof options === 'function') {
    return new APIKeyStrategy(options);
  }
  return new APIKeyStrategy(options, verify!);
}
