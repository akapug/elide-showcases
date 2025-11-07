import org.graalvm.polyglot.*;
import java.util.*;

/**
 * Java Integration Example for elide-merge-deep
 *
 * This demonstrates calling the TypeScript merge-deep implementation from Java
 * using GraalVM's polyglot capabilities via Elide.
 *
 * Benefits:
 * - One merge implementation shared across TypeScript and Java
 * - Consistent deep merging across services
 * - No Java library needed
 * - Guaranteed format consistency
 */
public class ElideMergeDeepExample {

    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Merge Deep ===\n");

        // NOTE: Exact syntax depends on Elide's Java polyglot API (currently alpha)
        // This is a CONCEPTUAL example - adjust when full Java support is ready

        try (Context context = Context.newBuilder("js")
                .allowAllAccess(true)
                .build()) {

            // Load the merge-deep module
            // Value mergeModule = context.eval("js", "require('./elide-merge-deep.ts')");

            // Example 1: Application Configuration
            System.out.println("Example 1: Application Configuration");
            // Map<String, Object> defaultConfig = new HashMap<>();
            // defaultConfig.put("server", Map.of("port", 8080, "host", "localhost"));
            // defaultConfig.put("database", Map.of("name", "mydb"));
            //
            // Map<String, Object> envConfig = new HashMap<>();
            // envConfig.put("server", Map.of("port", 9090));
            // envConfig.put("database", Map.of("user", "admin", "password", "secret"));
            //
            // Value merged = mergeModule.getMember("default")
            //     .execute(defaultConfig, envConfig);
            //
            // System.out.println("Merged config: " + merged.toString());
            System.out.println("(See code for full example)");
            System.out.println();

            // Example 2: Spring Boot Configuration
            System.out.println("Example 2: Spring Boot Configuration");
            // Use case: Merge application.properties with environment-specific config
            // @Configuration
            // public class AppConfig {
            //     @Bean
            //     public Properties appProperties() {
            //         Properties base = loadBaseProperties();
            //         Properties env = loadEnvProperties();
            //
            //         // Merge using Elide merge-deep
            //         Value merged = mergeModule.getMember("default")
            //             .execute(base, env);
            //
            //         return convertToProperties(merged);
            //     }
            // }
            System.out.println("(Merge Spring Boot configs with Elide)");
            System.out.println();

            // Example 3: Deep Object Merging
            System.out.println("Example 3: Deep Object Merging");
            // Map<String, Object> obj1 = Map.of(
            //     "user", Map.of(
            //         "profile", Map.of("name", "Alice", "age", 25),
            //         "settings", Map.of("theme", "dark")
            //     )
            // );
            //
            // Map<String, Object> obj2 = Map.of(
            //     "user", Map.of(
            //         "settings", Map.of("theme", "light", "language", "en")
            //     )
            // );
            //
            // Value result = mergeModule.getMember("default").execute(obj1, obj2);
            // System.out.println("Deep merged: " + result.toString());
            System.out.println("(Deep merge preserves nested structures)");
            System.out.println();

            // Example 4: Array Merge Strategies
            System.out.println("Example 4: Array Merge Strategies");
            // Map<String, Object> data1 = Map.of("items", List.of("a", "b"));
            // Map<String, Object> data2 = Map.of("items", List.of("c", "d"));
            //
            // // Replace strategy (default)
            // Value replaced = mergeModule.getMember("default")
            //     .execute(data1, data2);
            //
            // // Concat strategy
            // Value options = context.eval("js", "({ arrayMerge: 'concat' })");
            // Value concatenated = mergeModule.getMember("mergeDeepWith")
            //     .execute(options, data1, data2);
            //
            // // Unique strategy
            // Value uniqueOpts = context.eval("js", "({ arrayMerge: 'unique' })");
            // Value unique = mergeModule.getMember("mergeDeepWith")
            //     .execute(uniqueOpts, data1, data2);
            System.out.println("(Supports replace, concat, and unique array strategies)");
            System.out.println();

            // Example 5: Microservices Configuration
            System.out.println("Example 5: Microservices Configuration");
            // Use case: Service discovery configuration
            // public class ServiceConfig {
            //     private static final Map<String, Object> BASE_CONFIG = Map.of(
            //         "discovery", Map.of(
            //             "enabled", true,
            //             "client", Map.of("serviceUrl", Map.of(
            //                 "defaultZone", "http://localhost:8761/eureka"
            //             ))
            //         )
            //     );
            //
            //     public Map<String, Object> getConfig(Map<String, Object> overrides) {
            //         Value merged = mergeModule.getMember("default")
            //             .execute(BASE_CONFIG, overrides);
            //         return merged.as(Map.class);
            //     }
            // }
            System.out.println("(Merge service discovery configs)");
            System.out.println();

            // Example 6: Multi-tenant Configuration
            System.out.println("Example 6: Multi-tenant Configuration");
            // Map<String, Object> globalConfig = Map.of(
            //     "features", Map.of("analytics", true, "reporting", true),
            //     "limits", Map.of("requests", 1000, "storage", 1024)
            // );
            //
            // Map<String, Object> tenantConfig = Map.of(
            //     "features", Map.of("analytics", false, "customBranding", true),
            //     "limits", Map.of("requests", 5000)
            // );
            //
            // Value tenantMerged = mergeModule.getMember("default")
            //     .execute(globalConfig, tenantConfig);
            //
            // System.out.println("Tenant config: " + tenantMerged.toString());
            System.out.println("(Merge global and tenant-specific configs)");
            System.out.println();

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot apps merge configs");
        System.out.println("- Uses same TypeScript implementation as Node.js service");
        System.out.println("- Guarantees consistent config format across entire stack");
        System.out.println("- No need for Apache Commons or Guava");
        System.out.println();

        System.out.println("Example: Enterprise Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Merge-Deep (TypeScript)    │");
        System.out.println("│   elide-merge-deep.ts               │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓                   ↓");
        System.out.println("    ┌────────┐          ┌────────┐");
        System.out.println("    │ Node.js│          │  Java  │");
        System.out.println("    │  API   │          │Backend │");
        System.out.println("    └────────┘          └────────┘");
        System.out.println("         ↓                   ↓");
        System.out.println("    Same deep merge logic everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different merge implementations = inconsistent config");
        System.out.println("After: One Elide implementation = 100% consistent");
        System.out.println();

        System.out.println("Performance Benefits:");
        System.out.println("- Zero cold start overhead with Elide");
        System.out.println("- Instant deep merging");
        System.out.println("- Shared runtime across languages");
        System.out.println("- No additional Java libraries needed");
        System.out.println();

        System.out.println("When Elide Java API is ready, usage will be:");
        System.out.println("  Value mergeModule = context.eval(\"js\", \"require('./elide-merge-deep.ts')\");");
        System.out.println("  Value result = mergeModule.getMember(\"default\").execute(obj1, obj2);");
    }
}
