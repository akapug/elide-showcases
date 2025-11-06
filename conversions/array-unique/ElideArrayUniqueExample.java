/**
 * Java Integration Example for elide-array-unique
 *
 * This demonstrates calling the TypeScript unique implementation from Java
 * using Elide's polyglot capabilities.
 *
 * Benefits:
 * - One unique library shared across TypeScript and Java
 * - Consistent deduplication across all JVM services
 * - No Java Stream.distinct() needed for many cases
 * - Perfect for data processing, API responses
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is ready

public class ElideArrayUniqueExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Array Unique ===\n");

        // Example: Load TypeScript module
        // Context context = Polyglot.getContext();
        // Value uniqueModule = context.eval("js", "require('./elide-array-unique.ts')");

        // Example 1: Remove duplicates
        // List<Integer> data = Arrays.asList(1, 2, 2, 3, 3, 3, 4);
        // Value unique = uniqueModule.getMember("default").execute(data);
        // System.out.println(unique);  // [1, 2, 3, 4]

        // Example 2: Spring Boot Tag Service
        // @Service
        // public class TagService {
        //     private final Value uniqueModule;
        //
        //     public List<String> getUniqueTags(List<Article> articles) {
        //         List<String> allTags = articles.stream()
        //             .flatMap(a -> a.getTags().stream())
        //             .collect(Collectors.toList());
        //
        //         return uniqueModule.getMember("default")
        //             .execute(allTags)
        //             .as(List.class);
        //     }
        // }

        // Example 3: Data Deduplication API
        // @RestController
        // public class DataController {
        //     private final Value uniqueModule;
        //
        //     @PostMapping("/data/deduplicate")
        //     public ResponseEntity<List<?>> deduplicate(@RequestBody List<?> data) {
        //         List<?> result = uniqueModule.getMember("default")
        //             .execute(data)
        //             .as(List.class);
        //
        //         return ResponseEntity.ok(result);
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service deduplicates data");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent unique behavior");
        System.out.println();

        System.out.println("Example: Data Deduplication");
        System.out.println("┌─────────────────────────────────────────────┐");
        System.out.println("│   Elide Array Unique (TypeScript)         │");
        System.out.println("│   elide-array-unique.ts                    │");
        System.out.println("└─────────────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different unique implementations = inconsistent results");
        System.out.println("After: One Elide implementation = unified deduplication");
    }
}
