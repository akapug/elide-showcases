/**
 * Breadth-First Search (BFS) for graphs
 * Explores all neighbors at current depth before moving to next level
 * Time: O(V + E), Space: O(V)
 */

export type Graph = Map<string, string[]>;

export function bfs(graph: Graph, start: string, visit: (node: string) => void): void {
  const visited = new Set<string>();
  const queue: string[] = [start];
  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift()!;
    visit(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}

export function shortestPath(graph: Graph, start: string, target: string): string[] | null {
  const visited = new Set<string>([start]);
  const queue: Array<{ node: string; path: string[] }> = [{ node: start, path: [start] }];

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node === target) return path;

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return null;
}

export function levelOrder(graph: Graph, start: string): string[][] {
  const visited = new Set<string>([start]);
  const levels: string[][] = [[start]];
  let currentLevel = [start];

  while (currentLevel.length > 0) {
    const nextLevel: string[] = [];

    for (const node of currentLevel) {
      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nextLevel.push(neighbor);
        }
      }
    }

    if (nextLevel.length > 0) {
      levels.push(nextLevel);
      currentLevel = nextLevel;
    } else {
      break;
    }
  }

  return levels;
}

// CLI demo
if (import.meta.url.includes("graph-bfs.ts")) {
  const graph: Graph = new Map([
    ["A", ["B", "C"]],
    ["B", ["D", "E"]],
    ["C", ["F"]],
    ["D", []],
    ["E", ["F"]],
    ["F", []]
  ]);

  console.log("BFS Traversal:");
  const visited: string[] = [];
  bfs(graph, "A", (node) => visited.push(node));
  console.log(visited.join(" -> "));

  console.log("\nShortest Path A -> F:");
  const path = shortestPath(graph, "A", "F");
  console.log(path ? path.join(" -> ") : "No path found");

  console.log("\nLevel Order:");
  const levels = levelOrder(graph, "A");
  levels.forEach((level, i) => {
    console.log("Level " + i + ": " + level.join(", "));
  });

  console.log("✅ BFS test passed");
}
