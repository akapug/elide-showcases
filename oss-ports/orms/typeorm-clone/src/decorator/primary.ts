/**
 * Primary key decorators
 */

import { getMetadataArgsStorage } from '../metadata';
import { ColumnOptions } from './column';

/**
 * Primary column decorator
 */
export function PrimaryColumn(options?: ColumnOptions): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().columns.push({
      target: target.constructor,
      propertyName: propertyName as string,
      mode: 'regular',
      options: {
        ...options,
        primary: true
      }
    });
  };
}

/**
 * Primary generated column decorator
 */
export function PrimaryGeneratedColumn(options?: PrimaryGeneratedColumnOptions): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().columns.push({
      target: target.constructor,
      propertyName: propertyName as string,
      mode: 'regular',
      options: {
        ...options,
        primary: true,
        generated: options?.strategy || 'increment'
      }
    });

    getMetadataArgsStorage().generations.push({
      target: target.constructor,
      propertyName: propertyName as string,
      strategy: options?.strategy || 'increment'
    });
  };
}

export interface PrimaryGeneratedColumnOptions extends ColumnOptions {
  strategy?: 'increment' | 'uuid' | 'rowid' | 'identity';
}
