/**
 * Java Integration Example for elide-kind-of
 *
 * This demonstrates calling the TypeScript type detection implementation
 * from Java using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One type checker shared across TypeScript and Java
 * - Consistent type detection across all JVM services
 * - Handles JavaScript-specific types
 * - Perfect for Spring Boot debugging, logging
 */

public class ElideKindOfExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Type Checker ===\n");

        // Example: Spring Boot Debug Service
        // @Service
        // public class TypeDebugService {
        //     private final Value kindOfModule;
        //
        //     public String getType(Object value) {
        //         return kindOfModule.getMember("default")
        //             .execute(value)
        //             .asString();
        //     }
        //
        //     public void logWithType(Object value, String context) {
        //         String type = getType(value);
        //         logger.debug("[{}] value={}, type={}", context, value, type);
        //     }
        // }

        System.out.println("Real-world use cases:");
        System.out.println("- Spring Boot logging with type info");
        System.out.println("- API response validation");
        System.out.println("- Dynamic type-based processing");
        System.out.println("- JavaScript object inspection");
        System.out.println();

        System.out.println("Handles JavaScript-specific types:");
        System.out.println("  ✓ Map, Set, Promise");
        System.out.println("  ✓ TypedArrays");
        System.out.println("  ✓ Generators, Iterators");
    }
}
