/**
 * Java Integration Example for elide-tiny-markdown
 *
 * This demonstrates calling the TypeScript tiny-markdown implementation from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One tiny-markdown implementation shared across TypeScript and Java
 * - Consistent minimal markdown parser across all JVM services
 * - Perfect for Spring Boot, Micronaut, Quarkus
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideTinyMarkdownExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript tiny-markdown ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value tiny_markdownModule = context.eval("js",
        //     "const module = require('./elide-tiny-markdown.ts'); module;");

        // Example: Basic usage
        // Value result = tiny_markdownModule.getMember("default").execute();
        // System.out.println("Result: " + result);

        System.out.println("Real-world use case:");
        System.out.println("- Java service uses minimal markdown parser");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent behavior across platform");
        System.out.println("- Perfect for comment rendering, documentation, content formatting");
        System.out.println();

        System.out.println("Example: Microservices Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide tiny-markdown (TypeScript)         │");
        System.out.println("│   conversions/tiny-markdown/elide-tiny-markdown.ts│");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same minimal markdown parser everywhere!");
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
