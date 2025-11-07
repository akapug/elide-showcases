/**
 * Topological Sort for Directed Acyclic Graphs (DAG)
 * Linear ordering of vertices such that for every edge u->v, u comes before v
 * Time: O(V + E)
 */

export type Graph = Map<string, string[]>;

export function topologicalSort(graph: Graph): string[] | null {
  const inDegree = new Map<string, number>();
  const result: string[] = [];
  
  // Initialize in-degrees
  for (const node of graph.keys()) {
    if (!inDegree.has(node)) inDegree.set(node, 0);
  }
  
  for (const neighbors of graph.values()) {
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
    }
  }
  
  // Queue with all nodes having in-degree 0
  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }
  
  // Process queue
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }
  
  // Check for cycle
  return result.length === graph.size ? result : null;
}

export function topologicalSortDFS(graph: Graph): string[] | null {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: string[] = [];
  
  function visit(node: string): boolean {
    if (visiting.has(node)) return false; // Cycle detected
    if (visited.has(node)) return true;
    
    visiting.add(node);
    
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visit(neighbor)) return false;
    }
    
    visiting.delete(node);
    visited.add(node);
    result.unshift(node);
    return true;
  }
  
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (!visit(node)) return null; // Cycle detected
    }
  }
  
  return result;
}

// CLI demo
if (import.meta.url.includes("topological-sort.ts")) {
  // Task dependencies example
  const tasks: Graph = new Map([
    ["wake", ["breakfast"]],
    ["breakfast", ["work"]],
    ["work", ["dinner"]],
    ["shower", ["breakfast"]],
    ["dinner", []]
  ]);
  
  console.log("Topological Sort (Kahn's Algorithm):");
  const order1 = topologicalSort(tasks);
  console.log(order1 ? order1.join(" -> ") : "Cycle detected!");
  
  console.log("\nTopological Sort (DFS):");
  const order2 = topologicalSortDFS(tasks);
  console.log(order2 ? order2.join(" -> ") : "Cycle detected!");
  
  // Test cycle detection
  const cyclic: Graph = new Map([
    ["A", ["B"]],
    ["B", ["C"]],
    ["C", ["A"]]
  ]);
  
  console.log("\nCycle detection:");
  const result = topologicalSort(cyclic);
  console.log(result === null ? "✅ Cycle correctly detected" : "❌ Failed to detect cycle");
  
  console.log("✅ Topological sort test passed");
}
