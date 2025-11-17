/**
 * Index and unique constraint decorators
 */

import { getMetadataArgsStorage } from '../metadata';

export interface IndexOptions {
  unique?: boolean;
  where?: string;
  spatial?: boolean;
  fulltext?: boolean;
  parser?: string;
  sparse?: boolean;
  background?: boolean;
  expireAfterSeconds?: number;
}

export function Index(nameOrFields?: string | string[], options?: IndexOptions): ClassDecorator & PropertyDecorator {
  return function (target: Object | Function, propertyName?: string | symbol) {
    const isClass = typeof propertyName === 'undefined';

    getMetadataArgsStorage().indices.push({
      target: isClass ? target as Function : target.constructor,
      columns: Array.isArray(nameOrFields) ? nameOrFields : propertyName ? [propertyName as string] : [],
      name: typeof nameOrFields === 'string' ? nameOrFields : undefined,
      unique: options?.unique || false,
      spatial: options?.spatial,
      fulltext: options?.fulltext,
      where: options?.where
    });
  };
}

export function Unique(nameOrFields?: string | string[]): ClassDecorator & PropertyDecorator {
  return Index(nameOrFields, { unique: true });
}

export interface CheckOptions {
  expression: string;
}

export function Check(nameOrExpression: string, expression?: string): ClassDecorator {
  return function (target: Function) {
    getMetadataArgsStorage().checks.push({
      target,
      name: expression ? nameOrExpression : undefined,
      expression: expression || nameOrExpression
    });
  };
}

export function Exclusion(name: string, expression: string): ClassDecorator {
  return function (target: Function) {
    getMetadataArgsStorage().exclusions.push({
      target,
      name,
      expression
    });
  };
}
