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

    // ============================================================
    // Extended Usage Examples
    // ============================================================

    // Example: Spring Boot Service
    // @Service
    // public class ProcessingService {
    //     private final Value module;
    //
    //     public ProcessingService(Context context) {
    //         this.module = context.eval("js", "require('./elide-chunk-array.ts')");
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
    //         this.module = context.eval("js", "require('./elide-chunk-array.ts')");
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
    //         this.module = context.eval("js", "require('./elide-chunk-array.ts')");
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
    //         this.module = context.eval("js", "require('./elide-chunk-array.ts')");
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
    //         return context.eval("js", "require('./elide-chunk-array.ts')");
    //     }
    // }
}
