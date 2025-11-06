/**
 * Java Integration Example for elide-camelcase
 * This demonstrates calling the TypeScript camelCase implementation from Java.
 * Benefits: Consistent API response transformation across TypeScript and Java services.
 */

public class ElideCamelCaseExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript camelCase ===\n");

        // Example: Spring Boot JSON Transformation
        // @Service
        // public class CaseTransformService {
        //     public String toCamelCase(String str) {
        //         return camelCaseModule.getMember("default")
        //             .execute(str)
        //             .asString();
        //     }
        //
        //     public Map<String, Object> transformKeys(Map<String, Object> map) {
        //         return map.entrySet().stream()
        //             .collect(Collectors.toMap(
        //                 e -> toCamelCase(e.getKey()),
        //                 Map.Entry::getValue
        //             ));
        //     }
        // }

        System.out.println("Real-world use cases:");
        System.out.println("- Spring Boot API response transformation");
        System.out.println("- JSON serialization (snake_case → camelCase)");
        System.out.println("- Code generation");
    }
}
