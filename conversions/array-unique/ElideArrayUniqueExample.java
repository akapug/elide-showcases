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

    // ============================================================
    // Extended Usage Examples
    // ============================================================

    // Example: Spring Boot Service
    // @Service
    // public class ProcessingService {
    //     private final Value module;
    //
    //     public ProcessingService(Context context) {
    //         this.module = context.eval("js", "require('./elide-array-unique.ts')");
    //     }
    //
    //     public Object process(Object data) {
    //         return module.getMember("default").execute(data);
    //     }
    //
    //     public List<Object> processBatch(List<Object> items) {
    //         return items.stream()
    //             .map(this::process)
    //             .collect(Collectors.toList());
    //     }
    // }

    // Example: REST Controller
    // @RestController
    // @RequestMapping("/api")
    // public class DataController {
    //     private final Value module;
    //
    //     @PostMapping("/process")
    //     public ResponseEntity<Map<String, Object>> process(@RequestBody Map<String, Object> request) {
    //         try {
    //             Object data = request.get("data");
    //             Object result = module.getMember("default").execute(data);
    //             return ResponseEntity.ok(Map.of("result", result));
    //         } catch (Exception e) {
    //             return ResponseEntity.badRequest()
    //                 .body(Map.of("error", e.getMessage()));
    //         }
    //     }
    //
    //     @GetMapping("/batch")
    //     public ResponseEntity<List<Object>> processBatch(@RequestParam List<Object> items) {
    //         List<Object> results = items.stream()
    //             .map(item -> module.getMember("default").execute(item))
    //             .collect(Collectors.toList());
    //         return ResponseEntity.ok(results);
    //     }
    // }

    // Example: Async Processing
    // @Service
    // public class AsyncProcessingService {
    //     private final Value module;
    //     private final ExecutorService executor;
    //
    //     public AsyncProcessingService(Context context) {
    //         this.module = context.eval("js", "require('./elide-array-unique.ts')");
    //         this.executor = Executors.newFixedThreadPool(10);
    //     }
    //
    //     public CompletableFuture<Object> processAsync(Object data) {
    //         return CompletableFuture.supplyAsync(() -> 
    //             module.getMember("default").execute(data), executor);
    //     }
    //
    //     public CompletableFuture<List<Object>> processAllAsync(List<Object> items) {
    //         List<CompletableFuture<Object>> futures = items.stream()
    //             .map(this::processAsync)
    //             .collect(Collectors.toList());
    //         
    //         return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
    //             .thenApply(v -> futures.stream()
    //                 .map(CompletableFuture::join)
    //                 .collect(Collectors.toList()));
    //     }
    // }

    // Example: Caching Layer
    // @Service
    // public class CachedProcessingService {
    //     private final Value module;
    //     private final Cache<String, Object> cache;
    //
    //     public CachedProcessingService(Context context) {
    //         this.module = context.eval("js", "require('./elide-array-unique.ts')");
    //         this.cache = CacheBuilder.newBuilder()
    //             .maximumSize(1000)
    //             .expireAfterWrite(1, TimeUnit.HOURS)
    //             .build();
    //     }
    //
    //     public Object process(Object data) {
    //         String key = generateKey(data);
    //         return cache.get(key, () -> module.getMember("default").execute(data));
    //     }
    //
    //     private String generateKey(Object data) {
    //         return Integer.toString(data.hashCode());
    //     }
    // }

    // Example: Error Handling Wrapper
    // @Service
    // public class SafeProcessingService {
    //     private final Value module;
    //     private final Logger logger;
    //
    //     public SafeProcessingService(Context context) {
    //         this.module = context.eval("js", "require('./elide-array-unique.ts')");
    //         this.logger = LoggerFactory.getLogger(SafeProcessingService.class);
    //     }
    //
    //     public Result process(Object data) {
    //         try {
    //             logger.info("Processing data: {}", data);
    //             Object result = module.getMember("default").execute(data);
    //             logger.info("Success");
    //             return Result.success(result);
    //         } catch (Exception e) {
    //             logger.error("Error processing data", e);
    //             return Result.failure(e.getMessage());
    //         }
    //     }
    //
    //     public static class Result {
    //         private final boolean success;
    //         private final Object data;
    //         private final String error;
    //
    //         private Result(boolean success, Object data, String error) {
    //             this.success = success;
    //             this.data = data;
    //             this.error = error;
    //         }
    //
    //         public static Result success(Object data) {
    //             return new Result(true, data, null);
    //         }
    //
    //         public static Result failure(String error) {
    //             return new Result(false, null, error);
    //         }
    //
    //         public boolean isSuccess() { return success; }
    //         public Object getData() { return data; }
    //         public String getError() { return error; }
    //     }
    // }

    // Example: JUnit Testing
    // @SpringBootTest
    // public class ProcessingServiceTest {
    //     @Autowired
    //     private ProcessingService service;
    //
    //     @Test
    //     public void testProcess() {
    //         Object result = service.process(testData);
    //         assertNotNull(result);
    //     }
    //
    //     @Test
    //     public void testBatchProcessing() {
    //         List<Object> results = service.processBatch(testItems);
    //         assertEquals(testItems.size(), results.size());
    //     }
    //
    //     @Test
    //     public void testErrorHandling() {
    //         assertThrows(IllegalArgumentException.class, () -> {
    //             service.process(null);
    //         });
    //     }
    // }

    // Example: Configuration
    // @Configuration
    // public class ElideConfig {
    //     @Bean
    //     public Context polyglotContext() {
    //         return Context.newBuilder("js")
    //             .allowAllAccess(true)
    //             .build();
    //     }
    //
    //     @Bean
    //     public Value module(Context context) {
    //         return context.eval("js", "require('./elide-array-unique.ts')");
    //     }
    // }
}
