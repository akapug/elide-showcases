/**
 * Tree entity decorators
 */

import { getMetadataArgsStorage } from '../metadata';

export function Tree(type: 'materialized-path' | 'nested-set' | 'closure-table'): ClassDecorator {
  return function (target: Function) {
    getMetadataArgsStorage().trees.push({
      target,
      type
    });
  };
}

export function TreeParent(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().relations.push({
      target: target.constructor,
      propertyName: propertyName as string,
      relationType: 'tree-parent',
      type: () => target.constructor
    });
  };
}

export function TreeChildren(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().relations.push({
      target: target.constructor,
      propertyName: propertyName as string,
      relationType: 'tree-children',
      type: () => target.constructor
    });
  };
}

export function TreeLevelColumn(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().columns.push({
      target: target.constructor,
      propertyName: propertyName as string,
      mode: 'treeLevel'
    });
  };
}
