/**
 * Java Integration Example for elide-random-int
 *
 * This demonstrates calling the TypeScript random-int implementation from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One random-int implementation shared across TypeScript and Java
 * - Consistent generate a random integer within a range across all JVM services
 * - Perfect for Spring Boot, Micronaut, Quarkus
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideRandomIntExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript random-int ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value random_intModule = context.eval("js",
        //     "const module = require('./elide-random-int.ts'); module;");

        // Example: Basic usage
        // Value result = random_intModule.getMember("default").execute();
        // System.out.println("Result: " + result);

        System.out.println("Real-world use case:");
        System.out.println("- Java service uses generate a random integer within a range");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent behavior across platform");
        System.out.println("- Perfect for ID generation, sampling, testing, games");
        System.out.println();

        System.out.println("Example: Microservices Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide random-int (TypeScript)         │");
        System.out.println("│   conversions/random-int/elide-random-int.ts│");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same generate a random integer within a range everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Java custom + JavaScript = potential inconsistencies");
        System.out.println("After: One Elide implementation = 100% consistent");
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
        System.out.println("  }");
        System.out.println();

        System.out.println("Performance Benefits:");
        System.out.println("- GraalVM JIT optimization");
        System.out.println("- Zero overhead");
        System.out.println("- Shared runtime across services");
    }
}
