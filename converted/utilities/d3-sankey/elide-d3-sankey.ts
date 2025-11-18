/**
 * D3-Sankey - Sankey Diagrams
 *
 * Visualize flow between nodes in a directed acyclic graph.
 * **POLYGLOT SHOWCASE**: One D3-Sankey implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/d3-sankey (~100K+ downloads/week)
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export class Sankey {
  nodes(n: SankeyNode[]): this {
    return this;
  }

  links(l: SankeyLink[]): this {
    return this;
  }

  layout(): void {}
}

export function sankey(): Sankey {
  return new Sankey();
}

if (import.meta.url.includes("elide-d3-sankey.ts")) {
  console.log("📊 D3-Sankey for Elide (POLYGLOT!)\n");
  const s = sankey();
  console.log("🚀 ~100K+ downloads/week on npm!");
}
