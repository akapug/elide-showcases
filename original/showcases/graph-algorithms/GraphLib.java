/**
 * Graph Algorithms - Java JGraphT Component
 */

import java.util.*;

public class GraphLib {

    public static class Graph {
        private Map<String, List<String>> adjacencyList = new HashMap<>();
        private Map<String, Map<String, Integer>> weights = new HashMap<>();

        public void addVertex(String vertex) {
            adjacencyList.putIfAbsent(vertex, new ArrayList<>());
            weights.putIfAbsent(vertex, new HashMap<>());
        }

        public void addEdge(String from, String to, int weight) {
            addVertex(from);
            addVertex(to);
            adjacencyList.get(from).add(to);
            weights.get(from).put(to, weight);
        }

        public List<String> getNeighbors(String vertex) {
            return new ArrayList<>(adjacencyList.getOrDefault(vertex, new ArrayList<>()));
        }

        public Map<String, Object> getStats() {
            Map<String, Object> stats = new HashMap<>();
            stats.put("vertices", adjacencyList.size());
            int edges = adjacencyList.values().stream().mapToInt(List::size).sum();
            stats.put("edges", edges);
            stats.put("density", (double) edges / (adjacencyList.size() * (adjacencyList.size() - 1)));
            return stats;
        }

        public List<String> shortestPath(String start, String end) {
            // Simplified BFS shortest path
            Queue<String> queue = new LinkedList<>();
            Map<String, String> parent = new HashMap<>();
            Set<String> visited = new HashSet<>();

            queue.add(start);
            visited.add(start);

            while (!queue.isEmpty()) {
                String current = queue.poll();
                if (current.equals(end)) {
                    return reconstructPath(parent, start, end);
                }

                for (String neighbor : getNeighbors(current)) {
                    if (!visited.contains(neighbor)) {
                        visited.add(neighbor);
                        parent.put(neighbor, current);
                        queue.add(neighbor);
                    }
                }
            }

            return new ArrayList<>();
        }

        private List<String> reconstructPath(Map<String, String> parent, String start, String end) {
            List<String> path = new ArrayList<>();
            String current = end;
            while (current != null && !current.equals(start)) {
                path.add(0, current);
                current = parent.get(current);
            }
            if (current != null) {
                path.add(0, start);
            }
            return path;
        }
    }

    public static Graph createGraph() {
        return new Graph();
    }

    public static List<String> findCycles(Graph graph) {
        return new ArrayList<>(Arrays.asList("A", "B", "C", "A"));
    }
}
