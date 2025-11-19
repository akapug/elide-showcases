/**
 * Entity repository decorator
 */

import { getMetadataArgsStorage } from '../metadata';

export function EntityRepository(entity?: Function): ClassDecorator {
  return function (target: Function) {
    getMetadataArgsStorage().entityRepositories.push({
      target,
      entity
    });
  };
}

export function Transaction(connectionName?: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Transaction logic would be implemented here
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function TransactionManager(): ParameterDecorator {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    getMetadataArgsStorage().transactionEntityManagers.push({
      target: target.constructor,
      methodName: propertyKey as string,
      index: parameterIndex
    });
  };
}

export function TransactionRepository(entity?: Function): ParameterDecorator {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    getMetadataArgsStorage().transactionRepositories.push({
      target: target.constructor,
      methodName: propertyKey as string,
      index: parameterIndex,
      entity
    });
  };
}
