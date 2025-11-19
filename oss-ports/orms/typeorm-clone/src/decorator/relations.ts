/**
 * Relation decorators
 */

import { getMetadataArgsStorage } from '../metadata';

export interface RelationOptions {
  cascade?: boolean | ('insert' | 'update' | 'remove' | 'soft-remove' | 'recover')[];
  nullable?: boolean;
  onDelete?: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION';
  onUpdate?: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION';
  deferrable?: 'INITIALLY IMMEDIATE' | 'INITIALLY DEFERRED';
  eager?: boolean;
  lazy?: boolean;
  persistence?: boolean;
  orphanedRowAction?: 'nullify' | 'delete' | 'soft-delete' | 'disable';
}

export type RelationType = () => Function | string;

/**
 * One-to-one relation decorator
 */
export function OneToOne(
  typeFunctionOrTarget: RelationType,
  inverseSide?: string | ((object: any) => any),
  options?: RelationOptions
): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().relations.push({
      target: target.constructor,
      propertyName: propertyName as string,
      relationType: 'one-to-one',
      type: typeFunctionOrTarget,
      inverseSideProperty: inverseSide,
      options: options || {}
    });
  };
}

/**
 * One-to-many relation decorator
 */
export function OneToMany(
  typeFunctionOrTarget: RelationType,
  inverseSide: string | ((object: any) => any),
  options?: RelationOptions
): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().relations.push({
      target: target.constructor,
      propertyName: propertyName as string,
      relationType: 'one-to-many',
      type: typeFunctionOrTarget,
      inverseSideProperty: inverseSide,
      options: options || {}
    });
  };
}

/**
 * Many-to-one relation decorator
 */
export function ManyToOne(
  typeFunctionOrTarget: RelationType,
  inverseSide?: string | ((object: any) => any),
  options?: RelationOptions
): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().relations.push({
      target: target.constructor,
      propertyName: propertyName as string,
      relationType: 'many-to-one',
      type: typeFunctionOrTarget,
      inverseSideProperty: inverseSide,
      options: options || {}
    });
  };
}

/**
 * Many-to-many relation decorator
 */
export function ManyToMany(
  typeFunctionOrTarget: RelationType,
  inverseSide?: string | ((object: any) => any),
  options?: RelationOptions
): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().relations.push({
      target: target.constructor,
      propertyName: propertyName as string,
      relationType: 'many-to-many',
      type: typeFunctionOrTarget,
      inverseSideProperty: inverseSide,
      options: options || {}
    });
  };
}

/**
 * Join column decorator
 */
export function JoinColumn(options?: JoinColumnOptions | JoinColumnOptions[]): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    const columns = Array.isArray(options) ? options : [options || {}];

    getMetadataArgsStorage().joinColumns.push({
      target: target.constructor,
      propertyName: propertyName as string,
      name: columns[0]?.name,
      referencedColumnName: columns[0]?.referencedColumnName
    });
  };
}

export interface JoinColumnOptions {
  name?: string;
  referencedColumnName?: string;
}

/**
 * Join table decorator
 */
export function JoinTable(options?: JoinTableOptions): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().joinTables.push({
      target: target.constructor,
      propertyName: propertyName as string,
      name: options?.name,
      joinColumns: options?.joinColumn ? [options.joinColumn] : undefined,
      inverseJoinColumns: options?.inverseJoinColumn ? [options.inverseJoinColumn] : undefined,
      database: options?.database,
      schema: options?.schema
    });
  };
}

export interface JoinTableOptions {
  name?: string;
  database?: string;
  schema?: string;
  joinColumn?: JoinColumnOptions;
  inverseJoinColumn?: JoinColumnOptions;
}

/**
 * Relation ID decorator
 */
export function RelationId(
  relation: string | ((object: any) => any)
): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().relationIds.push({
      target: target.constructor,
      propertyName: propertyName as string,
      relation: relation
    });
  };
}
