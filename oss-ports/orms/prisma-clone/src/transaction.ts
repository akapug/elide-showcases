/**
 * Transaction Client
 */

import { PrismaClient } from './client';
import { TransactionOptions } from './types';

/**
 * Transaction Client - wraps PrismaClient for transaction context
 */
export class TransactionClient {
  constructor(
    private client: PrismaClient,
    private options?: TransactionOptions
  ) {}

  /**
   * Get model delegate (proxied to underlying client)
   */
  get(target: any, prop: string): any {
    const value = (this.client as any)[prop];

    if (value && typeof value === 'object') {
      return value;
    }

    return value;
  }
}
