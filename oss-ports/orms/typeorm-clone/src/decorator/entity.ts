/**
 * Entity decorator
 */

import { getMetadataArgsStorage } from '../metadata';

export interface EntityOptions {
  name?: string;
  database?: string;
  schema?: string;
  orderBy?: Record<string, 'ASC' | 'DESC'>;
  synchronize?: boolean;
  withoutRowid?: boolean;
}

/**
 * Entity decorator - marks class as database entity
 */
export function Entity(nameOrOptions?: string | EntityOptions): ClassDecorator {
  return function (target: Function) {
    const options = typeof nameOrOptions === 'string'
      ? { name: nameOrOptions }
      : nameOrOptions || {};

    getMetadataArgsStorage().tables.push({
      target,
      name: options.name || target.name,
      database: options.database,
      schema: options.schema,
      orderBy: options.orderBy,
      synchronize: options.synchronize !== false,
      withoutRowid: options.withoutRowid
    });
  };
}

/**
 * Abstract entity decorator
 */
export function AbstractEntity(): ClassDecorator {
  return function (target: Function) {
    getMetadataArgsStorage().tables.push({
      target,
      name: target.name,
      type: 'abstract'
    });
  };
}

/**
 * Table inheritance decorators
 */
export function TableInheritance(options: { column?: string; pattern?: 'STI' }): ClassDecorator {
  return function (target: Function) {
    getMetadataArgsStorage().inheritances.push({
      target,
      column: options.column,
      pattern: options.pattern
    });
  };
}

export function ChildEntity(discriminatorValue?: any): ClassDecorator {
  return function (target: Function) {
    getMetadataArgsStorage().discriminators.push({
      target,
      value: discriminatorValue
    });
  };
}
