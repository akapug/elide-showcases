/**
 * Java Integration Example for elide-deep-equal
 */

public class ElideDeepEqualExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Deep Equal ===\n");

        // Example: Deep comparison
        // Map<String, Object> obj1 = Map.of("user", Map.of("name", "Alice"));
        // Map<String, Object> obj2 = Map.of("user", Map.of("name", "Alice"));
        // boolean equal = deepEqualModule.getMember("default").execute(obj1, obj2).asBoolean();

        System.out.println("Real-world use case:");
        System.out.println("- Java test suite uses deep equal for assertions");
        System.out.println("- Uses same TypeScript implementation as Node.js");
        System.out.println("- Guarantees consistent comparison");
    }
}
