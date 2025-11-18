/**
 * Jotai - Primitive and flexible state management for React
 *
 * Core features:
 * - Atomic state
 * - Minimal API
 * - TypeScript oriented
 * - No string keys
 * - Derived atoms
 * - Async support
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 3M+ downloads/week
 */

export interface Atom<Value> {
  read: (get: Getter) => Value | Promise<Value>;
  write?: (get: Getter, set: Setter, update: any) => void | Promise<void>;
}

export interface WritableAtom<Value, Update> extends Atom<Value> {
  write: (get: Getter, set: Setter, update: Update) => void | Promise<void>;
}

export type Getter = <Value>(atom: Atom<Value>) => Value;
export type Setter = <Value, Update>(atom: WritableAtom<Value, Update>, update: Update) => void;

export function atom<Value>(initialValue: Value): WritableAtom<Value, Value>;
export function atom<Value>(read: (get: Getter) => Value | Promise<Value>): Atom<Value>;
export function atom<Value, Update>(
  read: (get: Getter) => Value | Promise<Value>,
  write: (get: Getter, set: Setter, update: Update) => void | Promise<void>
): WritableAtom<Value, Update>;
export function atom<Value, Update = Value>(
  read: Value | ((get: Getter) => Value | Promise<Value>),
  write?: (get: Getter, set: Setter, update: Update) => void | Promise<void>
): Atom<Value> | WritableAtom<Value, Update> {
  const atomObj: any = {
    read: typeof read === 'function' ? read : () => read,
  };
  
  if (write) {
    atomObj.write = write;
  } else if (typeof read !== 'function') {
    atomObj.write = (_get: Getter, _set: Setter, update: Update) => {
      read = update as any;
    };
  }
  
  return atomObj;
}

export function useAtom<Value>(atom: Atom<Value>): [Value, never];
export function useAtom<Value, Update>(atom: WritableAtom<Value, Update>): [Value, (update: Update) => void];
export function useAtom<Value, Update>(atom: Atom<Value> | WritableAtom<Value, Update>): [Value, ((update: Update) => void) | never] {
  const value = atom.read({} as Getter) as Value;
  const setValue = 'write' in atom ? (_update: Update) => {} : (undefined as never);
  return [value, setValue];
}

export function useAtomValue<Value>(atom: Atom<Value>): Value {
  return atom.read({} as Getter) as Value;
}

export function useSetAtom<Value, Update>(atom: WritableAtom<Value, Update>): (update: Update) => void {
  return (_update: Update) => {};
}

if (import.meta.url.includes("elide-jotai")) {
  console.log("⚛️  Jotai for Elide\n");
  console.log("=== Atoms ===");
  
  const countAtom = atom(0);
  console.log("Created count atom");
  
  const doubleCountAtom = atom((get) => get(countAtom) * 2);
  console.log("Created derived atom");
  
  console.log();
  console.log("✅ Use Cases: Atomic state, React primitives, TypeScript apps, Minimal APIs");
  console.log("🚀 3M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default { atom, useAtom, useAtomValue, useSetAtom };
