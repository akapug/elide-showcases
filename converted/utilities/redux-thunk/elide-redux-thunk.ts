/**
 * Redux Thunk - Thunk middleware for Redux
 *
 * Core features:
 * - Async action creators
 * - Delayed dispatch
 * - Conditional dispatch
 * - Access to state
 * - Simple async logic
 * - Minimal overhead
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 20M+ downloads/week
 */

export type ThunkAction<R, S, E, A> = (dispatch: ThunkDispatch<S, E, A>, getState: () => S, extraArgument: E) => R;
export type ThunkDispatch<S, E, A> = (action: A | ThunkAction<any, S, E, A>) => any;

export interface ThunkMiddleware<S = any, A = any, E = undefined> {
  (api: { dispatch: ThunkDispatch<S, E, A>; getState: () => S }): (
    next: (action: A) => A
  ) => (action: A | ThunkAction<any, S, E, A>) => any;
  withExtraArgument<E2>(extraArgument: E2): ThunkMiddleware<S, A, E2>;
}

function createThunkMiddleware<S, A, E>(extraArgument?: E): ThunkMiddleware<S, A, E> {
  const middleware: any = ({ dispatch, getState }: any) => (next: any) => (action: any) => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }
    return next(action);
  };

  middleware.withExtraArgument = <E2>(extra: E2) => createThunkMiddleware<S, A, E2>(extra);
  return middleware;
}

const thunk = createThunkMiddleware();

if (import.meta.url.includes("elide-redux-thunk")) {
  console.log("⚛️  Redux Thunk for Elide\n");
  console.log("=== Thunk Middleware ===");
  
  const asyncAction = (dispatch: any, getState: any) => {
    console.log("Async action executing");
    setTimeout(() => {
      dispatch({ type: 'ASYNC_COMPLETE' });
    }, 100);
  };
  
  console.log("Created async action");
  console.log();
  console.log("✅ Use Cases: Async actions, API calls, Delayed dispatch, Conditional logic");
  console.log("🚀 20M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default thunk;
export { thunk };
