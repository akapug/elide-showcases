import { createGraph } from "./GraphLib.java";

const graph = createGraph();
graph.addEdge("A", "B", 1);
graph.addEdge("B", "C", 2);
graph.addEdge("C", "D", 1);

console.log("Stats:", graph.getStats());
console.log("Path:", graph.shortestPath("A", "D"));
console.log("Neighbors:", graph.getNeighbors("B"));
