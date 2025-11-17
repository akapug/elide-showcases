/**
 * Utility functions
 */

import { PrismaClient, PrismaClientOptions } from './client';
import { VERSION, ENGINE_VERSION } from './index';

/**
 * Create Prisma Client instance
 */
export function createPrismaClient(options?: PrismaClientOptions): PrismaClient {
  return new PrismaClient(options);
}

/**
 * Create mock client for testing
 */
export function createMockClient(): any {
  return {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn()
  };
}

/**
 * Get Prisma version
 */
export function getPrismaVersion(): string {
  return VERSION;
}

/**
 * Get engine version
 */
export function getEngineVersion(): string {
  return ENGINE_VERSION;
}
