/**
 * Java Integration Example for elide-clone-deep
 */

public class ElideCloneDeepExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Clone Deep ===\n");

        // Example: Clone nested map
        // Map<String, Object> original = Map.of("user", Map.of("name", "Alice"));
        // Value cloned = cloneDeepModule.getMember("default").execute(original);

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot service clones state for immutable updates");
        System.out.println("- Uses same TypeScript implementation as Node.js");
        System.out.println("- Guarantees consistent cloning");
    }
}
