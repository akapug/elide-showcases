/**
 * Java Integration Example for elide-ms (Time Duration Parser)
 *
 * Demonstrates calling the TypeScript ms implementation from Java
 * for consistent time duration handling across JVM services.
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideMsExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript MS ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value msModule = context.eval("js", "require('./elide-ms.ts')");

        // Example 1: Parse time strings
        // long timeoutMs = msModule.invokeMember("parse", "30s").asLong();
        // System.out.println("'30s' = " + timeoutMs + "ms");  // 30000

        // Example 2: Spring Boot configuration
        // @Configuration
        // public class TimeoutConfig {
        //     private final Value msModule;
        //
        //     public TimeoutConfig(Context graalContext) {
        //         this.msModule = graalContext.eval("js", "require('./elide-ms.ts')");
        //     }
        //
        //     @Bean
        //     public RestTemplate restTemplate() {
        //         RestTemplate template = new RestTemplate();
        //         long timeout = msModule.invokeMember("parse", "30s").asLong();
        //         // Set timeout using same format as Node.js!
        //         template.setRequestFactory(
        //             new SimpleClientHttpRequestFactory() {{
        //                 setConnectTimeout((int) timeout);
        //                 setReadTimeout((int) timeout);
        //             }}
        //         );
        //         return template;
        //     }
        // }

        // Example 3: Scheduled tasks
        // @Service
        // public class ScheduledTasks {
        //     @Autowired
        //     private Value msModule;
        //
        //     @Scheduled(fixedDelay = #{msModule.invokeMember('parse', '5m').asLong()})
        //     public void cleanupTask() {
        //         // Runs every 5 minutes, same format as Node.js cron
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service reads config: timeout = '30s'");
        System.out.println("- Uses same ms parser as Node.js API");
        System.out.println("- Guarantees identical timeout across entire platform");
        System.out.println();

        System.out.println("Example: Microservices Configuration");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide MS (TypeScript)            │");
        System.out.println("│   conversions/ms/elide-ms.ts       │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Python │");
        System.out.println("    │  API   │  │Service │  │Worker  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("     All services parse '30s' = 30000ms");
        System.out.println("     ✓ Perfect consistency!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Each language parses time strings differently");
        System.out.println("After: One Elide implementation = identical parsing");
    }
}
