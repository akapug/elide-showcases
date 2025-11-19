/**
 * Validators
 */

import { PrismaClientOptions } from './types';
import { PrismaClientValidationError } from './errors';

/**
 * Validate client options
 */
export function validateClientOptions(options: PrismaClientOptions): void {
  if (options.connection) {
    if (options.connection.poolSize && options.connection.poolSize < 1) {
      throw new PrismaClientValidationError('poolSize must be at least 1');
    }

    if (options.connection.connectionTimeout && options.connection.connectionTimeout < 0) {
      throw new PrismaClientValidationError('connectionTimeout must be non-negative');
    }
  }
}

/**
 * Validate where input
 */
export function validateWhereInput(where: any, modelName: string): void {
  if (!where || typeof where !== 'object') {
    throw new PrismaClientValidationError(`Invalid where input for model ${modelName}`);
  }
}

/**
 * Validate data input
 */
export function validateDataInput(data: any, modelName: string): void {
  if (!data || typeof data !== 'object') {
    throw new PrismaClientValidationError(`Invalid data input for model ${modelName}`);
  }
}
