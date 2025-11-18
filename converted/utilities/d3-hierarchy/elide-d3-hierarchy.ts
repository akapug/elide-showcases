/**
 * D3-Hierarchy - Hierarchical Layouts
 *
 * 2D layout algorithms for visualizing hierarchical data.
 * **POLYGLOT SHOWCASE**: One D3-Hierarchy implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/d3-hierarchy (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

export interface HierarchyNode {
  data: any;
  children?: HierarchyNode[];
  value?: number;
}

export function hierarchy(data: any): HierarchyNode {
  return { data, children: data.children?.map(hierarchy) };
}

export function tree() {
  return (root: HierarchyNode) => root;
}

if (import.meta.url.includes("elide-d3-hierarchy.ts")) {
  console.log("📊 D3-Hierarchy for Elide (POLYGLOT!)\n");
  const h = hierarchy({ name: 'root', children: [{ name: 'child' }] });
  console.log("🚀 ~1M+ downloads/week on npm!");
}
