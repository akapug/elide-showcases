/**
 * Depth-First Search (DFS) for graphs
 * Explores as far as possible along each branch before backtracking
 * Time: O(V + E), Space: O(V)
 */

export type Graph = Map<string, string[]>;

export function dfs(graph: Graph, start: string, visit: (node: string) => void): void {
  const visited = new Set<string>();
  
  function dfsRecursive(node: string) {
    if (visited.has(node)) return;
    
    visited.add(node);
    visit(node);
    
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      dfsRecursive(neighbor);
    }
  }
  
  dfsRecursive(start);
}

export function dfsIterative(graph: Graph, start: string, visit: (node: string) => void): void {
  const visited = new Set<string>();
  const stack = [start];
  
  while (stack.length > 0) {
    const node = stack.pop()!;
    
    if (visited.has(node)) continue;
    
    visited.add(node);
    visit(node);
    
    const neighbors = graph.get(node) || [];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      stack.push(neighbors[i]);
    }
  }
}

export function findPath(graph: Graph, start: string, target: string): string[] | null {
  const visited = new Set<string>();
  const path: string[] = [];
  
  function dfs(node: string): boolean {
    if (visited.has(node)) return false;
    
    visited.add(node);
    path.push(node);
    
    if (node === target) return true;
    
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }
    
    path.pop();
    return false;
  }
  
  return dfs(start) ? path : null;
}

// CLI demo
if (import.meta.url.includes("graph-dfs.ts")) {
  const graph: Graph = new Map([
    ["A", ["B", "C"]],
    ["B", ["D", "E"]],
    ["C", ["F"]],
    ["D", []],
    ["E", ["F"]],
    ["F", []]
  ]);
  
  console.log("DFS Traversal (Recursive):");
  const visited: string[] = [];
  dfs(graph, "A", (node) => visited.push(node));
  console.log(visited.join(" -> ")); // A -> B -> D -> E -> F -> C
  
  console.log("\nDFS Traversal (Iterative):");
  const visited2: string[] = [];
  dfsIterative(graph, "A", (node) => visited2.push(node));
  console.log(visited2.join(" -> "));
  
  console.log("\nFind Path A -> F:");
  const path = findPath(graph, "A", "F");
  console.log(path ? path.join(" -> ") : "No path found");
  
  console.log("✅ DFS test passed");
}
