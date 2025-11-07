/**
 * Java Integration Example for elide-string-similarity
 *
 * This demonstrates calling the TypeScript string similarity implementation from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One string matching implementation shared across TypeScript and Java
 * - Consistent fuzzy matching across all JVM services
 * - No Java similarity library needed
 * - Perfect for Spring Boot, Micronaut, Quarkus
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideStringSimilarityExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript String Similarity ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value similarity = context.eval("js",
        //     "const module = require('./elide-string-similarity.ts'); module;");

        // Example 1: Basic similarity comparison
        // double score = similarity.getMember("compareTwoStrings")
        //     .execute("hello world", "hello word")
        //     .asDouble();
        // System.out.printf("Similarity: %.3f%n", score);
        // System.out.println();

        // Example 2: Find best match
        // String search = "apple";
        // String[] options = {"apples", "banana", "app", "application", "pear"};
        // Value result = similarity.getMember("findBestMatch")
        //     .execute(search, options);
        // Value bestMatch = result.getMember("bestMatch");
        // String target = bestMatch.getMember("target").asString();
        // double rating = bestMatch.getMember("rating").asDouble();
        // System.out.printf("Search: '%s'%n", search);
        // System.out.printf("Best match: '%s' (%.3f)%n", target, rating);
        // System.out.println();

        // Example 3: Spring Boot Service
        // @Service
        // public class FuzzySearchService {
        //     private final Value similarity;
        //
        //     public FuzzySearchService(Context graalContext) {
        //         this.similarity = graalContext.eval("js",
        //             "require('./elide-string-similarity.ts')");
        //     }
        //
        //     public String findBestProduct(String query, List<String> products) {
        //         Value result = similarity.getMember("findBestMatch")
        //             .execute(query, products.toArray(new String[0]));
        //         return result.getMember("bestMatch")
        //             .getMember("target")
        //             .asString();
        //     }
        //
        //     public List<String> findDuplicates(List<String> items, double threshold) {
        //         List<String> duplicates = new ArrayList<>();
        //         for (int i = 0; i < items.size(); i++) {
        //             for (int j = i + 1; j < items.size(); j++) {
        //                 double score = similarity.getMember("compareTwoStrings")
        //                     .execute(items.get(i), items.get(j))
        //                     .asDouble();
        //                 if (score >= threshold) {
        //                     duplicates.add(items.get(i) + " ≈ " + items.get(j));
        //                 }
        //             }
        //         }
        //         return duplicates;
        //     }
        // }

        // Example 4: JPA Entity with fuzzy matching
        // @Entity
        // public class Product {
        //     @Id
        //     private Long id;
        //     private String name;
        //
        //     @Transient
        //     private FuzzySearchService searchService;
        //
        //     public List<Product> findSimilarProducts(double threshold) {
        //         List<String> allNames = productRepository.findAllNames();
        //         Value similarity = searchService.getSimilarity();
        //         Value matches = similarity.getMember("findMatches")
        //             .execute(this.name, allNames.toArray(), threshold);
        //
        //         // Convert matches to Product list
        //         List<Product> similar = new ArrayList<>();
        //         for (int i = 0; i < matches.getArraySize(); i++) {
        //             String matchName = matches.getArrayElement(i)
        //                 .getMember("target")
        //                 .asString();
        //             similar.add(productRepository.findByName(matchName));
        //         }
        //         return similar;
        //     }
        // }

        // Example 5: REST Controller with autocomplete
        // @RestController
        // @RequestMapping("/api/search")
        // public class SearchController {
        //     @Autowired
        //     private FuzzySearchService fuzzySearch;
        //
        //     @GetMapping("/autocomplete")
        //     public List<SuggestionDTO> autocomplete(@RequestParam String query) {
        //         List<String> database = loadSearchDatabase();
        //         Value result = fuzzySearch.getSimilarity()
        //             .getMember("findBestMatch")
        //             .execute(query, database.toArray());
        //
        //         return result.getMember("ratings").as(List.class).stream()
        //             .filter(r -> r.getRating() > 0.3)
        //             .sorted(Comparator.comparing(SuggestionDTO::getRating).reversed())
        //             .limit(5)
        //             .collect(Collectors.toList());
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot service needs fuzzy product search");
        System.out.println("- Uses same TypeScript implementation as Node.js frontend");
        System.out.println("- Guarantees consistent search results across entire platform");
        System.out.println("- No java.text.Similarity or Apache Commons needed");
        System.out.println();

        System.out.println("Example: Microservices Platform");
        System.out.println("┌─────────────────────────────────────────┐");
        System.out.println("│   Elide String Similarity (TypeScript) │");
        System.out.println("│   elide-string-similarity.ts           │");
        System.out.println("└─────────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │Frontend│  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same fuzzy matching everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different libs in each language = inconsistent results");
        System.out.println("After: One Elide implementation = 100% consistent matching");
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
        System.out.println("      ");
        System.out.println("      @Bean");
        System.out.println("      public Value stringSimilarity(Context ctx) {");
        System.out.println("          return ctx.eval(\"js\",");
        System.out.println("              \"require('./elide-string-similarity.ts')\");");
        System.out.println("      }");
        System.out.println("  }");
        System.out.println();

        System.out.println("Performance Benefits:");
        System.out.println("- GraalVM JIT optimization");
        System.out.println("- Zero cold start overhead");
        System.out.println("- Shared runtime across services");
        System.out.println("- Native image compilation support");
    }
}
