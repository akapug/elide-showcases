/**
 * Java Integration Example for elide-uuid
 *
 * This demonstrates calling the TypeScript uuid implementation from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One UUID implementation shared across TypeScript and Java
 * - Consistent ID generation across all JVM services
 * - No Java UUID library needed (or can supplement it)
 * - Perfect for Spring Boot, Micronaut, Quarkus
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideUuidExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript UUID ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value uuidModule = context.eval("js",
        //     "const module = require('./elide-uuid.ts'); module;");

        // Example 1: Generate UUID
        // String uuid1 = uuidModule.getMember("v4").execute().asString();
        // System.out.println("Generated UUID: " + uuid1);
        //
        // boolean isValid = uuidModule.getMember("validate")
        //     .execute(uuid1)
        //     .asBoolean();
        // System.out.println("Validation: " + isValid);
        // System.out.println();

        // Example 2: Use in Spring Boot Service
        // @Service
        // public class UuidService {
        //     private final Value uuidModule;
        //
        //     public UuidService(Context graalContext) {
        //         this.uuidModule = graalContext.eval("js",
        //             "require('./elide-uuid.ts')");
        //     }
        //
        //     public String generateId() {
        //         return uuidModule.getMember("v4").execute().asString();
        //     }
        //
        //     public boolean validateId(String uuid) {
        //         return uuidModule.getMember("validate")
        //             .execute(uuid)
        //             .asBoolean();
        //     }
        // }

        // Example 3: JPA Entity with Elide UUID
        // @Entity
        // public class User {
        //     @Id
        //     private String id;
        //     private String name;
        //
        //     @PrePersist
        //     public void generateId() {
        //         UuidService uuidService = ApplicationContext.getBean(UuidService.class);
        //         this.id = uuidService.generateId();
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot service generates UUIDs for entities");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent ID format across entire platform");
        System.out.println("- No java.util.UUID discrepancies");
        System.out.println();

        System.out.println("Example: Microservices Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide UUID (TypeScript)          │");
        System.out.println("│   conversions/uuid/elide-uuid.ts   │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same UUID format everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: java.util.UUID + JavaScript uuid = different v4 implementations");
        System.out.println("After: One Elide implementation = 100% consistent UUIDs");
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
        System.out.println("- Zero cold start overhead");
        System.out.println("- Shared runtime across services");
        System.out.println("- Native image compilation support");
    }
}
