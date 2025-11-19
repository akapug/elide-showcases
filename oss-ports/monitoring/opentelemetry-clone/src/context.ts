/**
 * OpenTelemetry Context Implementation
 */

import type { Context, ContextManager } from './types';

class ContextImpl implements Context {
  constructor(private values: Map<symbol, unknown> = new Map()) {}

  getValue(key: symbol): unknown {
    return this.values.get(key);
  }

  setValue(key: symbol, value: unknown): Context {
    const newValues = new Map(this.values);
    newValues.set(key, value);
    return new ContextImpl(newValues);
  }

  deleteValue(key: symbol): Context {
    const newValues = new Map(this.values);
    newValues.delete(key);
    return new ContextImpl(newValues);
  }
}

class ContextManagerImpl implements ContextManager {
  private _activeContext: Context = new ContextImpl();

  active(): Context {
    return this._activeContext;
  }

  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    context: Context,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ...args: A
  ): ReturnType<F> {
    const previousContext = this._activeContext;
    this._activeContext = context;

    try {
      return fn.apply(thisArg, args);
    } finally {
      this._activeContext = previousContext;
    }
  }

  bind<T>(context: Context, target: T): T {
    // Would bind context to target
    return target;
  }

  enable(): this {
    return this;
  }

  disable(): this {
    return this;
  }
}

const contextManager = new ContextManagerImpl();

export const context = {
  active(): Context {
    return contextManager.active();
  },

  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    context: Context,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ...args: A
  ): ReturnType<F> {
    return contextManager.with(context, fn, thisArg, ...args);
  },

  bind<T>(context: Context, target: T): T {
    return contextManager.bind(context, target);
  },
};

export { ContextImpl as ROOT_CONTEXT };
export type { Context, ContextManager };
