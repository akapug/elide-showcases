/**
 * Java Integration Example for elide-array-flatten
 *
 * This demonstrates calling the TypeScript flatten implementation from Java
 * using Elide's polyglot capabilities.
 *
 * Benefits:
 * - One flatten library shared across TypeScript and Java
 * - Consistent array flattening across all JVM services
 * - No Java flatten utility needed for many cases
 * - Perfect for batch processing, data transformation
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is ready

public class ElideArrayFlattenExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Array Flatten ===\n");

        // Example: Load TypeScript module
        // Context context = Polyglot.getContext();
        // Value flattenModule = context.eval("js", "require('./elide-array-flatten.ts')");

        // Example 1: Flatten nested arrays
        // List<Object> nested = Arrays.asList(1, Arrays.asList(2, Arrays.asList(3, 4)));
        // Value flattened = flattenModule.getMember("default").execute(nested);
        // System.out.println(flattened);  // [1, 2, 3, 4]

        // Example 2: Spring Boot Batch Processor
        // @Service
        // public class BatchService {
        //     private final Value flattenModule;
        //
        //     public List<?> processBatchResults(List<List<?>> batchResults) {
        //         return flattenModule.getMember("default")
        //             .execute(batchResults, 1)
        //             .as(List.class);
        //     }
        //
        //     public List<?> deepFlatten(List<?> data) {
        //         return flattenModule.getMember("default")
        //             .execute(data, Double.POSITIVE_INFINITY)
        //             .as(List.class);
        //     }
        // }

        // Example 3: Data Transformation Pipeline
        // @RestController
        // public class DataTransformController {
        //     private final Value flattenModule;
        //
        //     @PostMapping("/transform/flatten")
        //     public ResponseEntity<List<?>> flattenData(
        //         @RequestBody List<?> data,
        //         @RequestParam(defaultValue = "Infinity") String depth
        //     ) {
        //         double depthValue = depth.equals("Infinity")
        //             ? Double.POSITIVE_INFINITY
        //             : Double.parseDouble(depth);
        //
        //         List<?> result = flattenModule.getMember("default")
        //             .execute(data, depthValue)
        //             .as(List.class);
        //
        //         return ResponseEntity.ok(result);
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service processes nested batch results");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent data flattening");
        System.out.println();

        System.out.println("Example: Batch Processing");
        System.out.println("┌─────────────────────────────────────────────┐");
        System.out.println("│   Elide Array Flatten (TypeScript)        │");
        System.out.println("│   elide-array-flatten.ts                   │");
        System.out.println("└─────────────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different flatten implementations = inconsistent data");
        System.out.println("After: One Elide implementation = unified flattening");
    }
}
