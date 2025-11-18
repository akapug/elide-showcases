/**
 * Elide Import-Fresh - Import Fresh Module
 *
 * NPM Package: import-fresh
 * Weekly Downloads: ~80,000,000
 * License: MIT
 */

export function importFresh<T = any>(moduleId: string): T {
  // Clear module from cache
  if (typeof require !== 'undefined' && require.cache) {
    const resolved = require.resolve(moduleId);
    delete require.cache[resolved];
    
    // Also delete from parent cache
    Object.keys(require.cache).forEach(key => {
      const mod = require.cache[key];
      if (mod && mod.children) {
        mod.children = mod.children.filter((child: any) => 
          child.id !== resolved
        );
      }
    });
  }
  
  // Import fresh
  return require(moduleId);
}

export default importFresh;
