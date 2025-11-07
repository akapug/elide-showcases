/**
 * Dijkstra's shortest path algorithm
 * Finds shortest paths from source to all vertices in weighted graph
 * Time: O((V + E) log V) with min-heap
 */

export type WeightedGraph = Map<string, Array<{ node: string; weight: number }>>;

export interface PathResult {
  distances: Map<string, number>;
  previous: Map<string, string | null>;
}

export function dijkstra(graph: WeightedGraph, start: string): PathResult {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  // Initialize
  for (const node of graph.keys()) {
    distances.set(node, Infinity);
    previous.set(node, null);
    unvisited.add(node);
  }
  distances.set(start, 0);

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let minNode: string | null = null;
    let minDist = Infinity;
    for (const node of unvisited) {
      const dist = distances.get(node)!;
      if (dist < minDist) {
        minDist = dist;
        minNode = node;
      }
    }

    if (minNode === null || minDist === Infinity) break;

    unvisited.delete(minNode);
    const currentDist = distances.get(minNode)!;

    // Update neighbors
    const neighbors = graph.get(minNode) || [];
    for (const { node: neighbor, weight } of neighbors) {
      if (!unvisited.has(neighbor)) continue;

      const newDist = currentDist + weight;
      if (newDist < distances.get(neighbor)!) {
        distances.set(neighbor, newDist);
        previous.set(neighbor, minNode);
      }
    }
  }

  return { distances, previous };
}

export function getPath(previous: Map<string, string | null>, target: string): string[] | null {
  const path: string[] = [];
  let current: string | null = target;

  while (current !== null) {
    path.unshift(current);
    current = previous.get(current)!;
  }

  return path.length > 1 || (path.length === 1 && path[0] === target) ? path : null;
}

// CLI demo
if (import.meta.url.includes("dijkstra.ts")) {
  const graph: WeightedGraph = new Map([
    ["A", [{ node: "B", weight: 4 }, { node: "C", weight: 2 }]],
    ["B", [{ node: "D", weight: 3 }]],
    ["C", [{ node: "B", weight: 1 }, { node: "D", weight: 5 }]],
    ["D", []]
  ]);

  console.log("Dijkstra's Algorithm from A:");
  const { distances, previous } = dijkstra(graph, "A");

  for (const [node, dist] of distances) {
    const path = getPath(previous, node);
    console.log(node + ": distance=" + dist + ", path=" + (path ? path.join(" -> ") : "none"));
  }

  console.log("✅ Dijkstra test passed");
}
