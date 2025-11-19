/**
 * Column decorators
 */

import { getMetadataArgsStorage } from '../metadata';

export interface ColumnOptions {
  type?: ColumnType;
  name?: string;
  length?: number;
  width?: number;
  nullable?: boolean;
  readonly?: boolean;
  select?: boolean;
  default?: any;
  unique?: boolean;
  comment?: string;
  precision?: number;
  scale?: number;
  zerofill?: boolean;
  unsigned?: boolean;
  charset?: string;
  collation?: string;
  enum?: any[];
  array?: boolean;
  transformer?: ValueTransformer;
  onUpdate?: string;
  insert?: boolean;
  update?: boolean;
}

export type ColumnType =
  | 'int'
  | 'bigint'
  | 'varchar'
  | 'text'
  | 'boolean'
  | 'decimal'
  | 'float'
  | 'double'
  | 'date'
  | 'time'
  | 'datetime'
  | 'timestamp'
  | 'json'
  | 'blob'
  | 'uuid';

export interface ValueTransformer {
  to(value: any): any;
  from(value: any): any;
}

/**
 * Column decorator
 */
export function Column(typeOrOptions?: ColumnType | ColumnOptions): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    const options = typeof typeOrOptions === 'string'
      ? { type: typeOrOptions }
      : typeOrOptions || {};

    const type = options.type || Reflect.getMetadata('design:type', target, propertyName);

    getMetadataArgsStorage().columns.push({
      target: target.constructor,
      propertyName: propertyName as string,
      mode: 'regular',
      options: {
        ...options,
        type: mapTypeToString(type)
      }
    });
  };
}

/**
 * Create date column
 */
export function CreateDateColumn(options?: ColumnOptions): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().columns.push({
      target: target.constructor,
      propertyName: propertyName as string,
      mode: 'createDate',
      options: {
        ...options,
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
      }
    });
  };
}

/**
 * Update date column
 */
export function UpdateDateColumn(options?: ColumnOptions): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().columns.push({
      target: target.constructor,
      propertyName: propertyName as string,
      mode: 'updateDate',
      options: {
        ...options,
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
      }
    });
  };
}

/**
 * Delete date column (for soft deletes)
 */
export function DeleteDateColumn(options?: ColumnOptions): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().columns.push({
      target: target.constructor,
      propertyName: propertyName as string,
      mode: 'deleteDate',
      options: {
        ...options,
        type: 'timestamp',
        nullable: true
      }
    });
  };
}

/**
 * Version column (for optimistic locking)
 */
export function VersionColumn(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().columns.push({
      target: target.constructor,
      propertyName: propertyName as string,
      mode: 'version',
      options: {
        type: 'int',
        default: 1
      }
    });
  };
}

/**
 * Map type to string
 */
function mapTypeToString(type: any): string {
  if (type === String) return 'varchar';
  if (type === Number) return 'int';
  if (type === Boolean) return 'boolean';
  if (type === Date) return 'timestamp';
  if (type === Object) return 'json';
  return 'varchar';
}
