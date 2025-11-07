/**
 * Graph Coloring Algorithms
 * Assign colors to vertices so no adjacent vertices share a color
 */

export type Graph = Map<string, string[]>;

export interface ColoringResult {
  colors: Map<string, number>;
  chromaticNumber: number;
}

export function greedyColoring(graph: Graph): ColoringResult {
  const colors = new Map<string, number>();
  const nodes = Array.from(graph.keys());

  for (const node of nodes) {
    const neighborColors = new Set<number>();

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (colors.has(neighbor)) {
        neighborColors.add(colors.get(neighbor)!);
      }
    }

    // Find smallest color not used by neighbors
    let color = 0;
    while (neighborColors.has(color)) {
      color++;
    }

    colors.set(node, color);
  }

  const chromaticNumber = Math.max(...Array.from(colors.values())) + 1;

  return { colors, chromaticNumber };
}

export function welshPowell(graph: Graph): ColoringResult {
  const nodes = Array.from(graph.keys());

  // Sort by degree (descending)
  const sortedNodes = nodes.sort((a, b) => {
    const degreeA = (graph.get(a) || []).length;
    const degreeB = (graph.get(b) || []).length;
    return degreeB - degreeA;
  });

  const colors = new Map<string, number>();

  for (const node of sortedNodes) {
    const neighborColors = new Set<number>();

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (colors.has(neighbor)) {
        neighborColors.add(colors.get(neighbor)!);
      }
    }

    let color = 0;
    while (neighborColors.has(color)) {
      color++;
    }

    colors.set(node, color);
  }

  const chromaticNumber = Math.max(...Array.from(colors.values())) + 1;

  return { colors, chromaticNumber };
}

export function isBipartite(graph: Graph): boolean {
  const colors = new Map<string, number>();
  const nodes = Array.from(graph.keys());

  for (const start of nodes) {
    if (colors.has(start)) continue;

    const queue = [start];
    colors.set(start, 0);

    while (queue.length > 0) {
      const node = queue.shift()!;
      const currentColor = colors.get(node)!;

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!colors.has(neighbor)) {
          colors.set(neighbor, 1 - currentColor);
          queue.push(neighbor);
        } else if (colors.get(neighbor) === currentColor) {
          return false;
        }
      }
    }
  }

  return true;
}

// CLI demo
if (import.meta.url.includes("graph-coloring.ts")) {
  const graph: Graph = new Map([
    ["A", ["B", "C"]],
    ["B", ["A", "C", "D"]],
    ["C", ["A", "B", "D"]],
    ["D", ["B", "C", "E"]],
    ["E", ["D"]]
  ]);

  console.log("Graph coloring (Greedy):");
  const result1 = greedyColoring(graph);
  console.log("Chromatic number:", result1.chromaticNumber);
  result1.colors.forEach((color, node) => {
    console.log("  " + node + ": color " + color);
  });

  console.log("\nGraph coloring (Welsh-Powell):");
  const result2 = welshPowell(graph);
  console.log("Chromatic number:", result2.chromaticNumber);

  const bipartiteGraph: Graph = new Map([
    ["A", ["C", "D"]],
    ["B", ["C", "D"]],
    ["C", ["A", "B"]],
    ["D", ["A", "B"]]
  ]);

  console.log("\nIs graph bipartite?", isBipartite(graph)); // false
  console.log("Is bipartite graph bipartite?", isBipartite(bipartiteGraph)); // true

  console.log("✅ Graph coloring test passed");
}
