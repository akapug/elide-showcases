/**
 * Java Integration Example for elide-chunk-array
 */

public class ElideChunkArrayExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Chunk Array ===\n");

        // Example: Load TypeScript module
        // Context context = Polyglot.getContext();
        // Value chunkModule = context.eval("js", "require('./elide-chunk-array.ts')");

        // Example 1: Batch processing
        // List<Integer> data = IntStream.range(0, 100).boxed().collect(Collectors.toList());
        // Value batches = chunkModule.getMember("default").execute(data, 10);

        // Example 2: Spring Boot Batch Service
        // @Service
        // public class BatchService {
        //     private final Value chunkModule;
        //
        //     public <T> List<List<T>> chunkForProcessing(List<T> items, int batchSize) {
        //         return chunkModule.getMember("default")
        //             .execute(items, batchSize)
        //             .as(List.class);
        //     }
        //
        //     public void processBatches(List<?> items, int batchSize) {
        //         List<List<?>> batches = chunkForProcessing(items, batchSize);
        //         batches.parallelStream().forEach(this::processBatch);
        //     }
        // }

        // Example 3: Pagination API
        // @RestController
        // public class DataController {
        //     private final Value chunkModule;
        //
        //     @GetMapping("/data")
        //     public ResponseEntity<List<?>> getData(
        //         @RequestParam(defaultValue = "20") int pageSize,
        //         @RequestParam(defaultValue = "0") int page
        //     ) {
        //         List<?> allData = dataService.getAll();
        //         List<List<?>> pages = chunkModule.getMember("default")
        //             .execute(allData, pageSize)
        //             .as(List.class);
        //
        //         return ResponseEntity.ok(pages.get(page));
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service chunks data for batch processing");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent batch sizes");
        System.out.println();

        System.out.println("Example: Batch Processing");
        System.out.println("┌─────────────────────────────────────────────┐");
        System.out.println("│   Elide Chunk Array (TypeScript)          │");
        System.out.println("│   elide-chunk-array.ts                     │");
        System.out.println("└─────────────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different chunk implementations = batch inconsistencies");
        System.out.println("After: One Elide implementation = unified chunking");
    }
}
