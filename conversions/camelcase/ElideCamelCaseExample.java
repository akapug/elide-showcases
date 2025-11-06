/**
 * Java Integration Example for elide-camelcase
 */

public class ElideCamelCaseExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript CamelCase ===\n");

        // Example: Spring Boot Field Transformation
        // @Service
        // public class FieldTransformer {
        //     private final Value camelCaseModule;
        //
        //     public Map<String, Object> toCamelCase(Map<String, Object> data) {
        //         Map<String, Object> result = new HashMap<>();
        //         data.forEach((k, v) -> {
        //             String camelKey = camelCaseModule.getMember("default")
        //                 .execute(k)
        //                 .asString();
        //             result.put(camelKey, v);
        //         });
        //         return result;
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service transforms field names");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent field naming");
    }
}
