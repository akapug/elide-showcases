/**
 * React Is - Type checking for React elements
 *
 * Core features:
 * - Element type checking
 * - Component detection
 * - Validate React elements
 * - Fragment detection
 * - Portal detection
 * - Context detection
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 100M+ downloads/week
 */

export function isElement(object: any): boolean {
  return typeof object === 'object' && object !== null && 'type' in object && 'props' in object;
}

export function isValidElementType(type: any): boolean {
  return typeof type === 'string' || typeof type === 'function' || typeof type === 'symbol';
}

export function isFragment(object: any): boolean {
  return isElement(object) && object.type === Symbol.for('react.fragment');
}

export function isPortal(object: any): boolean {
  return isElement(object) && object.type === Symbol.for('react.portal');
}

export function isContextConsumer(object: any): boolean {
  return isElement(object) && object.type?.$$typeof === Symbol.for('react.context');
}

export function isContextProvider(object: any): boolean {
  return isElement(object) && object.type?.$$typeof === Symbol.for('react.provider');
}

export function isForwardRef(object: any): boolean {
  return isElement(object) && object.type?.$$typeof === Symbol.for('react.forward_ref');
}

export function isMemo(object: any): boolean {
  return isElement(object) && object.type?.$$typeof === Symbol.for('react.memo');
}

export function isLazy(object: any): boolean {
  return typeof object === 'object' && object?.$$typeof === Symbol.for('react.lazy');
}

export function isSuspense(object: any): boolean {
  return isElement(object) && object.type === Symbol.for('react.suspense');
}

if (import.meta.url.includes("elide-react-is")) {
  console.log("⚛️  React Is for Elide\n");
  console.log("=== Type Checking ===");
  const elem = { type: 'div', props: {}, key: null };
  console.log("Is element:", isElement(elem));
  console.log("Valid type:", isValidElementType('div'));
  console.log();
  console.log("✅ Use Cases: Type validation, Element inspection, React tooling");
  console.log("🚀 100M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default { isElement, isValidElementType, isFragment, isPortal, isContextConsumer, isContextProvider, isForwardRef, isMemo, isLazy, isSuspense };
