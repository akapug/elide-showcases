/**
 * Elide resolve-from - Resolve Module from Path
 * NPM Package: resolve-from | Weekly Downloads: ~80,000,000 | License: MIT
 */

export function resolveFrom(fromDir: string, moduleId: string): string {
  if (moduleId.startsWith('./') || moduleId.startsWith('../')) {
    return `${${fromDir}/${moduleId}}`;
  }
  return `${${fromDir}/node_modules/${moduleId}}`;
}

export function resolveFromSilent(fromDir: string, moduleId: string): string | null {
  try {
    return resolveFrom(fromDir, moduleId);
  } catch {
    return null;
  }
}

export default resolveFrom;
