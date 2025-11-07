/**
 * Java Integration Example for elide-leven
 *
 * This demonstrates calling the TypeScript Levenshtein distance implementation
 * from Java using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One string distance implementation shared across TypeScript and Java
 * - Consistent fuzzy matching across all JVM services
 * - No Java Levenshtein library needed
 * - Perfect for Spring Boot search, autocomplete, spell checking
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideLevenExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Levenshtein Distance ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value levenModule = context.eval("js",
        //     "const module = require('./elide-leven.ts'); module;");

        // Example 1: Basic String Distance
        // int distance = levenModule.getMember("default")
        //     .execute("cat", "hat")
        //     .asInt();
        // System.out.println("Distance between 'cat' and 'hat': " + distance);
        // System.out.println();

        // Example 2: Spring Boot Fuzzy Search Service
        // @Service
        // public class FuzzySearchService {
        //     private final Value levenModule;
        //
        //     public FuzzySearchService(Context graalContext) {
        //         this.levenModule = graalContext.eval("js",
        //             "require('./elide-leven.ts')");
        //     }
        //
        //     public int calculateDistance(String str1, String str2) {
        //         return levenModule.getMember("default")
        //             .execute(str1, str2)
        //             .asInt();
        //     }
        //
        //     public String findClosestMatch(String target, List<String> candidates) {
        //         String[] candidateArray = candidates.toArray(new String[0]);
        //         return levenModule.getMember("closestMatch")
        //             .execute(target, candidateArray)
        //             .asString();
        //     }
        //
        //     public List<Product> fuzzySearchProducts(String query, int maxDistance) {
        //         return productRepository.findAll().stream()
        //             .map(product -> {
        //                 int distance = calculateDistance(
        //                     query.toLowerCase(),
        //                     product.getName().toLowerCase()
        //                 );
        //                 return new SearchResult(product, distance);
        //             })
        //             .filter(result -> result.distance <= maxDistance)
        //             .sorted(Comparator.comparingInt(r -> r.distance))
        //             .map(result -> result.product)
        //             .collect(Collectors.toList());
        //     }
        // }

        // Example 3: REST API with Autocomplete
        // @RestController
        // @RequestMapping("/api/search")
        // public class SearchController {
        //     @Autowired
        //     private FuzzySearchService fuzzySearchService;
        //
        //     @GetMapping("/autocomplete")
        //     public ResponseEntity<List<String>> autocomplete(
        //         @RequestParam String q,
        //         @RequestParam(defaultValue = "5") int limit
        //     ) {
        //         List<String> dictionary = loadDictionary();
        //         List<SearchResult> results = dictionary.stream()
        //             .map(word -> {
        //                 int distance = fuzzySearchService.calculateDistance(
        //                     q.toLowerCase(),
        //                     word.toLowerCase()
        //                 );
        //                 return new SearchResult(word, distance);
        //             })
        //             .filter(result -> result.distance <= 3)
        //             .sorted(Comparator.comparingInt(r -> r.distance))
        //             .limit(limit)
        //             .map(result -> result.word)
        //             .collect(Collectors.toList());
        //
        //         return ResponseEntity.ok(results);
        //     }
        // }

        // Example 4: Data Deduplication Batch Job
        // @Component
        // public class CustomerDeduplicationJob {
        //     @Autowired
        //     private FuzzySearchService fuzzySearchService;
        //
        //     @Scheduled(cron = "0 0 2 * * ?") // 2 AM daily
        //     public void deduplicateCustomers() {
        //         List<Customer> customers = customerRepository.findAll();
        //         List<DuplicatePair> duplicates = new ArrayList<>();
        //
        //         for (int i = 0; i < customers.size(); i++) {
        //             Customer c1 = customers.get(i);
        //             for (int j = i + 1; j < customers.size(); j++) {
        //                 Customer c2 = customers.get(j);
        //                 int distance = fuzzySearchService.calculateDistance(
        //                     c1.getName().toLowerCase(),
        //                     c2.getName().toLowerCase()
        //                 );
        //
        //                 if (distance <= 2) {
        //                     duplicates.add(new DuplicatePair(c1, c2, distance));
        //                 }
        //             }
        //         }
        //
        //         logger.info("Found {} potential duplicates", duplicates.size());
        //         duplicateAlertService.createAlerts(duplicates);
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Spring Boot fuzzy search for products/users");
        System.out.println("- Autocomplete REST APIs with typo tolerance");
        System.out.println("- Data deduplication batch jobs");
        System.out.println("- Command suggestion in CLI tools");
        System.out.println("- Natural language query processing");
        System.out.println();

        System.out.println("Example: Microservices Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Leven (TypeScript)         │");
        System.out.println("│   conversions/leven/elide-leven.ts │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same fuzzy matching everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Apache Commons Text + JS leven = different algorithms");
        System.out.println("After: One Elide implementation = 100% consistent distances");
        System.out.println();

        System.out.println("Spring Boot Integration (when ready):");
        System.out.println("  @Configuration");
        System.out.println("  public class ElideConfig {");
        System.out.println("      @Bean");
        System.out.println("      public Context graalContext() {");
        System.out.println("          return Context.newBuilder(\"js\")");
        System.out.println("              .allowAllAccess(true)");
        System.out.println("              .build();");
        System.out.println("      }");
        System.out.println();
        System.out.println("      @Bean");
        System.out.println("      public FuzzySearchService fuzzySearchService(Context context) {");
        System.out.println("          return new FuzzySearchService(context);");
        System.out.println("      }");
        System.out.println("  }");
        System.out.println();

        System.out.println("Performance Benefits:");
        System.out.println("- GraalVM JIT optimization");
        System.out.println("- Zero cold start overhead");
        System.out.println("- Shared runtime across services");
        System.out.println("- Native image compilation support");
        System.out.println("- Optimized with early termination");
    }
}
