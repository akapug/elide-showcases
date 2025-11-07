/**
 * Java Integration Example for elide-nanoid (Compact ID Generator)
 *
 * Demonstrates calling the TypeScript nanoid implementation from Java
 * for consistent compact URL-safe IDs across JVM services.
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideNanoidExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Nanoid ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value nanoidModule = context.eval("js", "require('./elide-nanoid.ts')");

        // Example 1: Generate compact IDs
        // String id1 = nanoidModule.invokeMember("nanoid").asString();
        // System.out.println("ID 1: " + id1);  // e.g., "V1StGXR8_Z5jdHi6B-myT"
        //
        // String id2 = nanoidModule.invokeMember("nanoid").asString();
        // System.out.println("ID 2: " + id2);  // e.g., "Uakgb_J5m9g-0JDMbcJqL"

        // Example 2: Custom sizes
        // String shortId = nanoidModule.invokeMember("nanoid", 10).asString();
        // System.out.println("Short ID (10): " + shortId);  // e.g., "IRFa-VaY2b"
        //
        // String longId = nanoidModule.invokeMember("nanoid", 32).asString();
        // System.out.println("Long ID (32): " + longId);

        // Example 3: Spring Boot URL Shortener
        // @RestController
        // @RequestMapping("/api")
        // public class UrlShortenerController {
        //     private final Value nanoidModule;
        //
        //     public UrlShortenerController(Context graalContext) {
        //         this.nanoidModule = graalContext.eval("js", "require('./elide-nanoid.ts')");
        //     }
        //
        //     @PostMapping("/shorten")
        //     public ResponseEntity<ShortUrlResponse> shortenUrl(@RequestBody String longUrl) {
        //         // Get alphanumeric alphabet
        //         Value alphabets = nanoidModule.getMember("alphabets");
        //         String alphanum = alphabets.getMember("alphanumeric").asString();
        //
        //         // Create custom generator for 8-char codes
        //         Value generator = nanoidModule.invokeMember("customAlphabet", alphanum, 8);
        //         String shortCode = generator.execute().asString();
        //
        //         // Same short code format as Node.js!
        //         String shortUrl = "https://short.ly/" + shortCode;
        //         return ResponseEntity.ok(new ShortUrlResponse(shortUrl, shortCode));
        //     }
        // }

        // Example 4: JPA Entity with compact IDs
        // @Entity
        // @Table(name = "users")
        // public class User {
        //     @Id
        //     private String id;  // Compact nanoid instead of UUID
        //
        //     @Column(unique = true)
        //     private String username;
        //
        //     @PrePersist
        //     public void generateId() {
        //         Context context = Context.getCurrent();
        //         Value nanoid = context.eval("js", "require('./elide-nanoid.ts')");
        //         this.id = "user_" + nanoid.invokeMember("nanoid", 16).asString();
        //     }
        // }

        // Example 5: Scheduled tasks with unique IDs
        // @Service
        // public class BackgroundTasks {
        //     @Autowired
        //     private Value nanoidModule;
        //
        //     @Scheduled(fixedDelay = 60000)
        //     public void processTask() {
        //         String taskId = nanoidModule.invokeMember("nanoid", 16).asString();
        //         logger.info("Processing task: {}", taskId);
        //         // Same ID format as Node.js workers
        //     }
        // }

        // Example 6: API key generation
        // @Service
        // public class ApiKeyService {
        //     private final Value nanoidModule;
        //
        //     public String generateApiKey() {
        //         Value alphabets = nanoidModule.getMember("alphabets");
        //         String alphanum = alphabets.getMember("alphanumeric").asString();
        //         Value generator = nanoidModule.invokeMember("customAlphabet", alphanum, 32);
        //         String key = generator.execute().asString();
        //         return "sk_" + key;  // Secret key
        //     }
        //
        //     public String generatePublicKey() {
        //         // ... similar but with "pk_" prefix
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service generates short URL codes");
        System.out.println("- Uses same nanoid as Node.js API");
        System.out.println("- Guarantees identical ID format across entire platform");
        System.out.println();

        System.out.println("Example: URL Shortener Microservices");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Nanoid (TypeScript)        │");
        System.out.println("│   conversions/nanoid/elide-nanoid.ts│");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Python │");
        System.out.println("    │  API   │  │Service │  │Worker  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("     All services generate: 'aB3x9K1z' (8 chars)");
        System.out.println("     ✓ Perfect consistency!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Each language generates different ID formats");
        System.out.println("After: One Elide implementation = identical compact IDs");
        System.out.println();

        System.out.println("Benefits:");
        System.out.println("  ✓ 60% smaller than UUID (21 vs 36 chars)");
        System.out.println("  ✓ URL-safe (no special encoding needed)");
        System.out.println("  ✓ Collision-resistant");
        System.out.println("  ✓ Faster to generate and index");
    }
}
