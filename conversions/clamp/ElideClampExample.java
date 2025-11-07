/**
 * Java Integration Example for elide-clamp
 */

public class ElideClampExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Clamp ===\n");

        // Example: Spring Boot Input Validation
        // @Service
        // public class ValidationService {
        //     private final Value clampModule;
        //
        //     public double validateRange(double value, double min, double max) {
        //         return clampModule.getMember("default")
        //             .execute(value, min, max)
        //             .asDouble();
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service validates numeric input");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent boundary handling");
    }
}
