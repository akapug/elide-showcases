/**
 * vue-property-decorator - Decorators for Vue.js components
 *
 * Core features:
 * - @Prop decorator
 * - @Watch decorator
 * - @Emit decorator
 * - @Model decorator
 * - @Provide/@Inject decorators
 * - @Ref decorator
 * - Type-safe props
 * - Enhanced DX
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 2M+ downloads/week
 */

import type { PropOptions } from './types';

export { Component, mixins } from '../vue-class-component/elide-vue-class-component';

interface ComponentOptions {
  props?: Record<string, PropOptions | any>;
  computed?: Record<string, any>;
  watch?: Record<string, any>;
  methods?: Record<string, Function>;
  provide?: Record<string, any> | (() => Record<string, any>);
  inject?: Record<string, any> | string[];
  [key: string]: any;
}

function createDecorator(factory: (options: ComponentOptions, key: string) => void) {
  return (target: any, key: string) => {
    const Ctor = typeof target === 'function' ? target : target.constructor;
    if (!Ctor.__decorators__) {
      Ctor.__decorators__ = [];
    }
    Ctor.__decorators__.push((options: ComponentOptions) => factory(options, key));
  };
}

export function Prop(options?: PropOptions | any): PropertyDecorator {
  return createDecorator((componentOptions, key) => {
    if (!componentOptions.props) {
      componentOptions.props = {};
    }
    componentOptions.props[key] = options || {};
  });
}

export function PropSync(propName: string, options?: PropOptions): PropertyDecorator {
  return createDecorator((componentOptions, key) => {
    if (!componentOptions.props) {
      componentOptions.props = {};
    }
    componentOptions.props[propName] = options || {};

    if (!componentOptions.computed) {
      componentOptions.computed = {};
    }
    componentOptions.computed[key] = {
      get(this: any) {
        return this[propName];
      },
      set(this: any, value: any) {
        this.$emit(`update:${propName}`, value);
      }
    };
  });
}

export function Model(event?: string, options?: PropOptions): PropertyDecorator {
  return createDecorator((componentOptions, key) => {
    if (!componentOptions.props) {
      componentOptions.props = {};
    }
    const eventName = event || 'input';
    componentOptions.props.value = options || {};
    componentOptions.model = { prop: 'value', event: eventName };
  });
}

export function Watch(path: string, options?: { immediate?: boolean; deep?: boolean }): MethodDecorator {
  return createDecorator((componentOptions, key) => {
    if (!componentOptions.watch) {
      componentOptions.watch = {};
    }
    componentOptions.watch[path] = {
      handler: key,
      ...options
    };
  });
}

export function Emit(event?: string): MethodDecorator {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      const result = original.apply(this, args);
      const eventName = event || key.replace(/([A-Z])/g, '-$1').toLowerCase();

      if (result !== undefined) {
        this.$emit(eventName, result, ...args);
      } else {
        this.$emit(eventName, ...args);
      }

      return result;
    };
    return descriptor;
  };
}

export function Provide(key?: string | symbol): PropertyDecorator {
  return createDecorator((componentOptions, propKey) => {
    if (!componentOptions.provide) {
      componentOptions.provide = {};
    }
    const provideKey = key || propKey;
    const original = componentOptions.provide;

    componentOptions.provide = function (this: any) {
      const rv = typeof original === 'function' ? original.call(this) : original;
      rv[provideKey] = this[propKey];
      return rv;
    };
  });
}

export function Inject(options?: { from?: string | symbol; default?: any }): PropertyDecorator {
  return createDecorator((componentOptions, key) => {
    if (!componentOptions.inject) {
      componentOptions.inject = {};
    }
    componentOptions.inject[key] = options || key;
  });
}

export function ProvideReactive(key?: string | symbol): PropertyDecorator {
  return Provide(key);
}

export function InjectReactive(options?: { from?: string | symbol; default?: any }): PropertyDecorator {
  return Inject(options);
}

export function Ref(refKey?: string): PropertyDecorator {
  return createDecorator((componentOptions, key) => {
    if (!componentOptions.computed) {
      componentOptions.computed = {};
    }
    componentOptions.computed[key] = {
      cache: false,
      get(this: any) {
        return this.$refs[refKey || key];
      }
    };
  });
}

export function VModel(propsKey?: string): PropertyDecorator {
  return createDecorator((componentOptions, key) => {
    const propKey = propsKey || 'value';
    if (!componentOptions.props) {
      componentOptions.props = {};
    }
    componentOptions.props[propKey] = {};

    if (!componentOptions.computed) {
      componentOptions.computed = {};
    }
    componentOptions.computed[key] = {
      get(this: any) {
        return this[propKey];
      },
      set(this: any, value: any) {
        this.$emit('input', value);
      }
    };
  });
}

if (import.meta.url.includes("vue-property-decorator")) {
  console.log("🎯 vue-property-decorator for Elide - Decorators for Vue.js\n");

  console.log("=== Property Decorators ===");

  class ExampleComponent {
    @Prop({ type: String, required: true })
    title!: string;

    @Prop({ type: Number, default: 0 })
    count!: number;

    @Watch('count', { immediate: true })
    onCountChange(newVal: number, oldVal: number) {
      console.log(`Count changed from ${oldVal} to ${newVal}`);
    }

    @Emit()
    addToCount(n: number) {
      return this.count + n;
    }

    @Emit('reset')
    resetCount() {
      // This will emit 'reset' event
    }

    @Provide('theme')
    theme = 'dark';

    @Inject({ from: 'config', default: {} })
    config!: any;

    @Ref()
    readonly button!: HTMLButtonElement;
  }

  console.log("Component with decorators defined");

  console.log("\n=== Decorator Types ===");
  console.log("- @Prop: Property declaration");
  console.log("- @Watch: Watch property changes");
  console.log("- @Emit: Emit events");
  console.log("- @Provide/@Inject: Dependency injection");
  console.log("- @Ref: Template refs");

  console.log();
  console.log("✅ Use Cases: TypeScript Vue apps, Type-safe components, Enterprise");
  console.log("🚀 2M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default { Prop, Watch, Emit, Provide, Inject, Ref, VModel };
