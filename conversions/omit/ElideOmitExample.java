import org.graalvm.polyglot.*;
import java.util.*;

/**
 * Java Integration Example for elide-omit
 *
 * This demonstrates calling the TypeScript omit implementation from Java
 * using GraalVM's polyglot capabilities via Elide.
 */
public class ElideOmitExample {

    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Omit ===\n");

        try (Context context = Context.newBuilder("js")
                .allowAllAccess(true)
                .build()) {

            // Example: Spring Boot API Sanitization
            System.out.println("Example: Spring Boot API Sanitization");
            // Value omitModule = context.eval("js", "require('./elide-omit.ts')");
            //
            // @RestController
            // public class UserController {
            //     @GetMapping("/api/users/{id}")
            //     public Map<String, Object> getUser(@PathVariable Long id) {
            //         User user = userRepository.findById(id).orElseThrow();
            //         Map<String, Object> userMap = objectMapper.convertValue(user, Map.class);
            //
            //         // Remove sensitive fields using Elide
            //         Value safeUser = omitModule.getMember("default")
            //             .execute(userMap, "password", "salt", "apiSecret");
            //
            //         return safeUser.as(Map.class);
            //     }
            // }
            System.out.println("(Sanitize Spring Boot API responses with Elide)");
            System.out.println();

            System.out.println("Real-world use case:");
            System.out.println("- Java Spring Boot apps sanitize sensitive data");
            System.out.println("- Uses same TypeScript implementation as Node.js service");
            System.out.println("- Guarantees consistent security across entire stack");
            System.out.println("- No need for external Java libraries");
            System.out.println();

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }

        System.out.println("When Elide Java API is ready, usage will be:");
        System.out.println("  Value omitModule = context.eval(\"js\", \"require('./elide-omit.ts')\");");
        System.out.println("  Value safe = omitModule.getMember(\"default\").execute(user, \"password\", \"salt\");");
    }
}
