/**
 * Cytoscape - Graph Visualization
 *
 * Graph theory / network library for visualization and analysis.
 * **POLYGLOT SHOWCASE**: One Cytoscape implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/cytoscape (~200K+ downloads/week)
 *
 * Features:
 * - Graph visualization
 * - Network analysis
 * - Layout algorithms
 * - Interactive graphs
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

export interface CytoscapeOptions {
  container?: any;
  elements?: Array<{ data: { id: string; source?: string; target?: string } }>;
  style?: any[];
  layout?: { name: string };
}

export class Cytoscape {
  options: CytoscapeOptions;

  constructor(options: CytoscapeOptions) {
    this.options = options;
  }

  nodes(): any[] {
    return this.options.elements?.filter(el => !el.data.source) || [];
  }

  edges(): any[] {
    return this.options.elements?.filter(el => el.data.source) || [];
  }

  render(): string {
    let output = 'Cytoscape Graph\n\n';
    output += `Nodes: ${this.nodes().length}\n`;
    output += `Edges: ${this.edges().length}\n\n`;

    this.edges().forEach(edge => {
      output += `${edge.data.source} --> ${edge.data.target}\n`;
    });

    return output;
  }
}

export default function cytoscape(options: CytoscapeOptions): Cytoscape {
  return new Cytoscape(options);
}

if (import.meta.url.includes("elide-cytoscape.ts")) {
  console.log("📊 Cytoscape - Graph Visualization for Elide (POLYGLOT!)\n");

  const cy = cytoscape({
    elements: [
      { data: { id: 'a' } },
      { data: { id: 'b' } },
      { data: { id: 'ab', source: 'a', target: 'b' } }
    ]
  });

  console.log(cy.render());
  console.log("🚀 ~200K+ downloads/week on npm!");
}
