/**
 * Java Integration Example for elide-is-primitive
 *
 * This demonstrates calling the TypeScript primitive type checker from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One type checker shared across TypeScript and Java
 * - Consistent primitive validation across all JVM services
 * - Zero dependencies needed
 * - Perfect for Spring Boot validation, serialization, caching
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// Assuming: import org.graalvm.polyglot.Context;
//          import org.graalvm.polyglot.Value;

public class ElideIsPrimitiveExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript is-primitive ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value isPrimitiveModule = context.eval("js",
        //     "const module = require('./elide-is-primitive.ts'); module;");

        // Example 1: Bean Validation
        // @Component
        // public class PrimitiveValidator {
        //     private final Value isPrimitive;
        //
        //     public PrimitiveValidator(Context graalContext) {
        //         this.isPrimitive = graalContext.eval("js",
        //             "require('./elide-is-primitive.ts').default");
        //     }
        //
        //     public boolean isPrimitive(Object value) {
        //         return isPrimitive.execute(value).asBoolean();
        //     }
        //
        //     public void validatePrimitiveFields(Object bean, List<String> fields) {
        //         for (String field : fields) {
        //             Object value = getFieldValue(bean, field);
        //             if (!isPrimitive(value)) {
        //                 throw new ValidationException(
        //                     field + " must be primitive type");
        //             }
        //         }
        //     }
        // }

        // Example 2: JSON Serialization Helper
        // @Service
        // public class SerializationService {
        //     private final Value isPrimitive;
        //
        //     public SerializationService(Context graalContext) {
        //         this.isPrimitive = graalContext.eval("js",
        //             "require('./elide-is-primitive.ts').default");
        //     }
        //
        //     public boolean canSerializeDirectly(Object value) {
        //         return isPrimitive.execute(value).asBoolean();
        //     }
        //
        //     public Map<String, Object> filterPrimitives(Map<String, Object> map) {
        //         return map.entrySet().stream()
        //             .filter(e -> canSerializeDirectly(e.getValue()))
        //             .collect(Collectors.toMap(
        //                 Map.Entry::getKey,
        //                 Map.Entry::getValue
        //             ));
        //     }
        // }

        // Example 3: Cache Key Generator
        // @Component
        // public class CacheKeyGenerator {
        //     private final Value isPrimitive;
        //
        //     public CacheKeyGenerator(Context graalContext) {
        //         this.isPrimitive = graalContext.eval("js",
        //             "require('./elide-is-primitive.ts').default");
        //     }
        //
        //     public String generateKey(Map<String, Object> params) {
        //         Map<String, Object> primitiveParams = params.entrySet().stream()
        //             .filter(e -> isPrimitive.execute(e.getValue()).asBoolean())
        //             .collect(Collectors.toMap(
        //                 Map.Entry::getKey,
        //                 Map.Entry::getValue
        //             ));
        //
        //         return primitiveParams.entrySet().stream()
        //             .sorted(Map.Entry.comparingByKey())
        //             .map(e -> e.getKey() + "=" + e.getValue())
        //             .collect(Collectors.joining("&"));
        //     }
        // }

        // Example 4: Deep Clone Helper
        // @Service
        // public class CloneService {
        //     private final Value isPrimitive;
        //
        //     public CloneService(Context graalContext) {
        //         this.isPrimitive = graalContext.eval("js",
        //             "require('./elide-is-primitive.ts').default");
        //     }
        //
        //     @SuppressWarnings("unchecked")
        //     public Object deepClone(Object obj) {
        //         if (isPrimitive.execute(obj).asBoolean()) {
        //             return obj;  // Primitives don't need cloning
        //         }
        //         if (obj instanceof Map) {
        //             Map<Object, Object> map = (Map<Object, Object>) obj;
        //             return map.entrySet().stream()
        //                 .collect(Collectors.toMap(
        //                     Map.Entry::getKey,
        //                     e -> deepClone(e.getValue())
        //                 ));
        //         }
        //         if (obj instanceof List) {
        //             List<Object> list = (List<Object>) obj;
        //             return list.stream()
        //                 .map(this::deepClone)
        //                 .collect(Collectors.toList());
        //         }
        //         return obj;
        //     }
        // }

        // Example 5: REST API Validator
        // @RestController
        // public class UserController {
        //     private final Value isPrimitive;
        //
        //     public UserController(Context graalContext) {
        //         this.isPrimitive = graalContext.eval("js",
        //             "require('./elide-is-primitive.ts').default");
        //     }
        //
        //     @PostMapping("/users")
        //     public ResponseEntity<?> createUser(@RequestBody Map<String, Object> userData) {
        //         List<String> primitiveFields = Arrays.asList("name", "email", "age");
        //         
        //         for (String field : primitiveFields) {
        //             Object value = userData.get(field);
        //             if (value != null && !isPrimitive.execute(value).asBoolean()) {
        //                 return ResponseEntity.badRequest()
        //                     .body(field + " must be primitive type");
        //             }
        //         }
        //         
        //         // Create user...
        //         return ResponseEntity.ok().build();
        //     }
        // }

        System.out.println("Real-world use cases:");
        System.out.println("- Spring Boot bean validation");
        System.out.println("- JSON serialization helpers");
        System.out.println("- Cache key generation");
        System.out.println("- Deep clone optimization");
        System.out.println("- REST API validation");
        System.out.println("- Type guards for primitives");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different primitive checks in TypeScript vs Java");
        System.out.println("After: One Elide implementation = consistent behavior");
        System.out.println();

        System.out.println("When Elide Java API is ready:");
        System.out.println("  Context ctx = Context.newBuilder(\"js\").build();");
        System.out.println("  Value isPrimitive = ctx.eval(\"js\", \"require('./elide-is-primitive.ts').default\");");
        System.out.println("  boolean result = isPrimitive.execute(5).asBoolean();  // true");
    }
}
