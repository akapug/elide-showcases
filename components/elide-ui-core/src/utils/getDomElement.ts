export function getDomElement(ref: any): HTMLElement | null {
  if (!ref) return null;
  if (ref instanceof HTMLElement) return ref;
  if ('current' in ref) return ref.current;
  return null;
}
