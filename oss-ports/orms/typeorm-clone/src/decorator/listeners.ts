/**
 * Entity lifecycle event listeners
 */

import { getMetadataArgsStorage } from '../metadata';

export function BeforeInsert(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'before-insert'
    });
  };
}

export function AfterInsert(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'after-insert'
    });
  };
}

export function BeforeUpdate(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'before-update'
    });
  };
}

export function AfterUpdate(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'after-update'
    });
  };
}

export function BeforeRemove(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'before-remove'
    });
  };
}

export function AfterRemove(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'after-remove'
    });
  };
}

export function BeforeLoad(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'before-load'
    });
  };
}

export function AfterLoad(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'after-load'
    });
  };
}

export function BeforeSoftRemove(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'before-soft-remove'
    });
  };
}

export function AfterSoftRemove(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'after-soft-remove'
    });
  };
}

export function BeforeRecover(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'before-recover'
    });
  };
}

export function AfterRecover(): PropertyDecorator {
  return function (target: Object, propertyName: string | symbol) {
    getMetadataArgsStorage().entityListeners.push({
      target: target.constructor,
      propertyName: propertyName as string,
      type: 'after-recover'
    });
  };
}
