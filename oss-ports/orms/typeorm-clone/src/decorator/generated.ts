/**
 * Generated column decorators
 */

import { getMetadataArgsStorage } from '../metadata';

export function Generated(strategy?: 'increment' | 'uuid' | 'rowid' | 'identity'): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().generations.push({
      target: target.constructor,
      propertyName: propertyName as string,
      strategy: strategy || 'increment'
    });
  };
}
