/**
 * Java Integration Example for elide-shallow-clone
 *
 * This demonstrates calling the TypeScript shallow-clone implementation from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One shallow-clone implementation shared across TypeScript and Java
 * - Consistent create a shallow copy of objects or arrays across all JVM services
 * - Perfect for Spring Boot, Micronaut, Quarkus
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideShallowCloneExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript shallow-clone ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value shallow_cloneModule = context.eval("js",
        //     "const module = require('./elide-shallow-clone.ts'); module;");

        // Example: Basic usage
        // Value result = shallow_cloneModule.getMember("default").execute();
        // System.out.println("Result: " + result);

        System.out.println("Real-world use case:");
        System.out.println("- Java service uses create a shallow copy of objects or arrays");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent behavior across platform");
        System.out.println("- Perfect for state management, immutability, object copying");
        System.out.println();

        System.out.println("Example: Microservices Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide shallow-clone (TypeScript)         │");
        System.out.println("│   conversions/shallow-clone/elide-shallow-clone.ts│");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same create a shallow copy of objects or arrays everywhere!");
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
