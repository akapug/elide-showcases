/**
 * @vue/reactivity - Vue 3 Reactivity System
 *
 * Core features:
 * - Reactive proxies
 * - Computed values
 * - Watch and watchEffect
 * - Ref and reactive
 * - Effect tracking
 * - Dependency collection
 * - Framework-agnostic
 * - Standalone package
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 15M+ downloads/week
 */

const targetMap = new WeakMap<any, Map<string | symbol, Set<ReactiveEffect>>>();
let activeEffect: ReactiveEffect | undefined;
const effectStack: ReactiveEffect[] = [];

type Dep = Set<ReactiveEffect>;
type KeyToDepMap = Map<any, Dep>;

class ReactiveEffect {
  private _fn: () => any;
  deps: Dep[] = [];
  active = true;

  constructor(fn: () => any, public scheduler?: (effect: ReactiveEffect) => void) {
    this._fn = fn;
  }

  run() {
    if (!this.active) {
      return this._fn();
    }

    try {
      effectStack.push(this);
      activeEffect = this;
      return this._fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  }

  stop() {
    if (this.active) {
      this.deps.forEach(dep => dep.delete(this));
      this.deps.length = 0;
      this.active = false;
    }
  }
}

function track(target: object, key: string | symbol) {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

function trigger(target: object, key: string | symbol) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (!dep) return;

  const effects = new Set(dep);
  effects.forEach(effect => {
    if (effect.scheduler) {
      effect.scheduler(effect);
    } else {
      effect.run();
    }
  });
}

export function reactive<T extends object>(target: T): T {
  return new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      track(target, key);
      return result;
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key);
      return result;
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      trigger(target, key);
      return result;
    }
  });
}

export interface Ref<T = any> {
  value: T;
  _isRef: true;
}

export function ref<T>(value: T): Ref<T> {
  return new RefImpl(value);
}

class RefImpl<T> {
  private _value: T;
  public readonly _isRef = true;
  private dep: Dep = new Set();

  constructor(value: T) {
    this._value = value;
  }

  get value() {
    if (activeEffect) {
      this.dep.add(activeEffect);
      activeEffect.deps.push(this.dep);
    }
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;
    const effects = new Set(this.dep);
    effects.forEach(effect => {
      if (effect.scheduler) {
        effect.scheduler(effect);
      } else {
        effect.run();
      }
    });
  }
}

export function computed<T>(getter: () => T) {
  let value: T;
  let dirty = true;

  const effect = new ReactiveEffect(getter, () => {
    if (!dirty) {
      dirty = true;
      trigger(obj, 'value');
    }
  });

  const obj = {
    get value() {
      if (dirty) {
        value = effect.run();
        dirty = false;
      }
      track(obj, 'value');
      return value;
    },
    _isRef: true
  };

  return obj as Ref<T>;
}

export function effect<T = any>(fn: () => T): ReactiveEffect {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
  return _effect;
}

export function watch<T>(
  source: () => T,
  callback: (newValue: T, oldValue: T) => void,
  options?: { immediate?: boolean }
) {
  let oldValue: T;
  let getter = source;

  const job = () => {
    const newValue = _effect.run();
    callback(newValue, oldValue);
    oldValue = newValue;
  };

  const _effect = new ReactiveEffect(getter, job);

  if (options?.immediate) {
    job();
  } else {
    oldValue = _effect.run();
  }

  return () => _effect.stop();
}

export function watchEffect(effect: () => void) {
  const _effect = new ReactiveEffect(effect);
  _effect.run();
  return () => _effect.stop();
}

export function isRef(r: any): r is Ref {
  return !!(r && r._isRef === true);
}

export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref;
}

export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K
): Ref<T[K]> {
  return {
    get value() {
      return object[key];
    },
    set value(newValue) {
      object[key] = newValue;
    },
    _isRef: true
  };
}

export function toRefs<T extends object>(object: T): {
  [K in keyof T]: Ref<T[K]>
} {
  const ret: any = {};
  for (const key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}

export function readonly<T extends object>(target: T): T {
  return new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      track(target, key);
      return result;
    },
    set() {
      console.warn('Set operation on readonly object');
      return true;
    }
  });
}

if (import.meta.url.includes("vue-reactivity")) {
  console.log("🎯 @vue/reactivity for Elide - Vue 3 Reactivity System\n");

  console.log("=== Reactive Object ===");
  const state = reactive({ count: 0, name: 'Vue' });
  console.log("Initial state:", state);

  console.log("\n=== Effect Tracking ===");
  effect(() => {
    console.log("Effect runs when count changes:", state.count);
  });
  state.count++;

  console.log("\n=== Ref ===");
  const count = ref(0);
  console.log("Initial ref:", count.value);
  count.value = 5;
  console.log("Updated ref:", count.value);

  console.log("\n=== Computed ===");
  const double = computed(() => count.value * 2);
  console.log("Computed (count * 2):", double.value);
  count.value = 10;
  console.log("After count update:", double.value);

  console.log("\n=== Watch ===");
  const user = reactive({ name: 'John', age: 30 });
  watch(
    () => user.age,
    (newAge, oldAge) => {
      console.log(`Age changed from ${oldAge} to ${newAge}`);
    }
  );
  user.age = 31;

  console.log();
  console.log("✅ Use Cases: State management, Reactive programming, Framework-agnostic");
  console.log("🚀 15M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default { reactive, ref, computed, effect, watch, watchEffect };
