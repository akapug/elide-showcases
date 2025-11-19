/**
 * @elide/passport - Base Strategy
 * Abstract base class for authentication strategies
 */

import { Strategy as IStrategy, DoneCallback, AuthInfo } from '../types';

/**
 * Base Strategy class
 * All authentication strategies should extend this class
 */
export abstract class Strategy implements IStrategy {
  public name: string;

  constructor(name?: string) {
    if (!name) {
      throw new Error('Strategy requires a name');
    }
    this.name = name;
  }

  /**
   * Authenticate request
   * Must be implemented by subclasses
   * @param req - Request object
   * @param options - Strategy-specific options
   */
  abstract authenticate(req: any, options?: any): void;

  /**
   * Internal function for authentication success
   * @param user - Authenticated user
   * @param info - Additional auth info
   */
  success(user: any, info?: AuthInfo): void {
    // This will be overridden by the framework
  }

  /**
   * Internal function for authentication failure
   * @param challenge - Challenge information
   * @param status - HTTP status code
   */
  fail(challenge?: any, status?: number): void {
    // This will be overridden by the framework
  }

  /**
   * Internal function for redirect
   * @param url - Redirect URL
   * @param status - HTTP status code
   */
  redirect(url: string, status?: number): void {
    // This will be overridden by the framework
  }

  /**
   * Internal function to pass to next middleware
   */
  pass(): void {
    // This will be overridden by the framework
  }

  /**
   * Internal function for authentication error
   * @param err - Error object
   */
  error(err: Error): void {
    // This will be overridden by the framework
  }
}
