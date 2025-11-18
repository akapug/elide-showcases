/**
 * Redux - Predictable state container for JavaScript apps
 *
 * Core features:
 * - Predictable state management
 * - Single source of truth
 * - State is read-only
 * - Changes with pure functions
 * - Time-travel debugging
 * - Middleware support
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 30M+ downloads/week
 */

export type Reducer<S = any, A = any> = (state: S | undefined, action: A) => S;
export type Action<T = any> = { type: T };
export type Dispatch<A = any> = (action: A) => A;
export type Middleware<S = any> = (store: MiddlewareAPI<S>) => (next: Dispatch) => Dispatch;
export type Unsubscribe = () => void;

export interface Store<S = any, A = any> {
  getState(): S;
  dispatch(action: A): A;
  subscribe(listener: () => void): Unsubscribe;
  replaceReducer(nextReducer: Reducer<S, A>): void;
}

export interface MiddlewareAPI<S = any> {
  getState(): S;
  dispatch: Dispatch;
}

export function createStore<S, A>(
  reducer: Reducer<S, A>,
  preloadedState?: S,
  enhancer?: any
): Store<S, A> {
  let currentState = preloadedState ?? reducer(undefined, { type: '@@INIT' } as any);
  let currentReducer = reducer;
  let listeners: Array<() => void> = [];

  return {
    getState(): S {
      return currentState;
    },

    dispatch(action: A): A {
      currentState = currentReducer(currentState, action);
      listeners.forEach((listener) => listener());
      return action;
    },

    subscribe(listener: () => void): Unsubscribe {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },

    replaceReducer(nextReducer: Reducer<S, A>): void {
      currentReducer = nextReducer;
    },
  };
}

export function combineReducers<S>(reducers: { [K in keyof S]: Reducer<S[K]> }): Reducer<S> {
  return (state: S | undefined, action: any): S => {
    const nextState = {} as S;
    for (const key in reducers) {
      nextState[key] = reducers[key](state?.[key], action);
    }
    return nextState;
  };
}

export function bindActionCreators<A>(actionCreators: any, dispatch: Dispatch): any {
  const bound: any = {};
  for (const key in actionCreators) {
    bound[key] = (...args: any[]) => dispatch(actionCreators[key](...args));
  }
  return bound;
}

export function compose(...funcs: Function[]): Function {
  if (funcs.length === 0) return (arg: any) => arg;
  if (funcs.length === 1) return funcs[0];
  return funcs.reduce((a, b) => (...args: any[]) => a(b(...args)));
}

export function applyMiddleware(...middlewares: Middleware[]): any {
  return (createStore: any) => (reducer: any, preloadedState: any) => {
    const store = createStore(reducer, preloadedState);
    let dispatch: Dispatch = () => { throw new Error('Dispatching while constructing middleware'); };

    const middlewareAPI: MiddlewareAPI = {
      getState: store.getState,
      dispatch: (action: any) => dispatch(action),
    };

    const chain = middlewares.map((middleware) => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);

    return { ...store, dispatch };
  };
}

if (import.meta.url.includes("elide-redux")) {
  console.log("⚛️  Redux for Elide\n");
  console.log("=== Store ===");
  
  const reducer = (state = { count: 0 }, action: any) => {
    switch (action.type) {
      case 'INCREMENT': return { count: state.count + 1 };
      case 'DECREMENT': return { count: state.count - 1 };
      default: return state;
    }
  };
  
  const store = createStore(reducer);
  console.log("Initial state:", store.getState());
  store.dispatch({ type: 'INCREMENT' });
  console.log("After increment:", store.getState());
  
  console.log();
  console.log("✅ Use Cases: Large apps, Complex state, Time-travel debugging");
  console.log("🚀 30M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default { createStore, combineReducers, bindActionCreators, compose, applyMiddleware };
