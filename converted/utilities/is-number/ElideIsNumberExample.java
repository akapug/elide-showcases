/**
 * Java Integration Example for elide-is-number
 *
 * This demonstrates calling the TypeScript number validation implementation
 * from Java using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One number validation implementation shared across TypeScript and Java
 * - Consistent validation rules across all JVM services
 * - No Java validation library needed
 * - Perfect for Spring Boot, Micronaut, input validation
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideIsNumberExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Number Validation ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value isNumberModule = context.eval("js",
        //     "const module = require('./elide-is-number.ts'); module;");

        // Example 1: Basic Number Validation
        // boolean isValid = isNumberModule.getMember("default")
        //     .execute(5)
        //     .asBoolean();
        // System.out.println("isNumber(5): " + isValid);
        //
        // boolean isValidString = isNumberModule.getMember("default")
        //     .execute("5")
        //     .asBoolean();
        // System.out.println("isNumber(\"5\"): " + isValidString);
        //
        // boolean isInvalid = isNumberModule.getMember("default")
        //     .execute("foo")
        //     .asBoolean();
        // System.out.println("isNumber(\"foo\"): " + isInvalid);
        // System.out.println();

        // Example 2: Spring Boot Validation Service
        // @Service
        // public class ValidationService {
        //     private final Value isNumberModule;
        //
        //     public ValidationService(Context graalContext) {
        //         this.isNumberModule = graalContext.eval("js",
        //             "require('./elide-is-number.ts')");
        //     }
        //
        //     public boolean isNumber(Object value) {
        //         return isNumberModule.getMember("default")
        //             .execute(value)
        //             .asBoolean();
        //     }
        //
        //     public void validateProductPrice(String price) {
        //         if (!isNumber(price)) {
        //             throw new ValidationException("Invalid price: must be a number");
        //         }
        //     }
        //
        //     public void validatePaginationParams(String page, String limit) {
        //         if (!isNumber(page)) {
        //             throw new ValidationException("Invalid page parameter");
        //         }
        //         if (!isNumber(limit)) {
        //             throw new ValidationException("Invalid limit parameter");
        //         }
        //     }
        // }

        // Example 3: REST API Parameter Validation
        // @RestController
        // @RequestMapping("/api/products")
        // public class ProductController {
        //     @Autowired
        //     private ValidationService validationService;
        //
        //     @GetMapping
        //     public ResponseEntity<?> getProducts(
        //         @RequestParam(defaultValue = "1") String page,
        //         @RequestParam(defaultValue = "10") String limit
        //     ) {
        //         try {
        //             validationService.validatePaginationParams(page, limit);
        //         } catch (ValidationException e) {
        //             return ResponseEntity.badRequest()
        //                 .body(Map.of("error", e.getMessage()));
        //         }
        //
        //         int pageNum = Integer.parseInt(page);
        //         int limitNum = Integer.parseInt(limit);
        //
        //         List<Product> products = productService.findAll(pageNum, limitNum);
        //         return ResponseEntity.ok(products);
        //     }
        // }

        // Example 4: Bean Validation Custom Constraint
        // @Target({ ElementType.FIELD, ElementType.PARAMETER })
        // @Retention(RetentionPolicy.RUNTIME)
        // @Constraint(validatedBy = IsNumberValidator.class)
        // public @interface IsNumber {
        //     String message() default "must be a valid number";
        //     Class<?>[] groups() default {};
        //     Class<? extends Payload>[] payload() default {};
        // }
        //
        // public class IsNumberValidator implements ConstraintValidator<IsNumber, Object> {
        //     private Value isNumberModule;
        //
        //     @Override
        //     public void initialize(IsNumber constraintAnnotation) {
        //         Context context = Context.newBuilder("js").allowAllAccess(true).build();
        //         this.isNumberModule = context.eval("js",
        //             "require('./elide-is-number.ts')");
        //     }
        //
        //     @Override
        //     public boolean isValid(Object value, ConstraintValidatorContext context) {
        //         if (value == null) return false;
        //         return isNumberModule.getMember("default")
        //             .execute(value)
        //             .asBoolean();
        //     }
        // }
        //
        // // Usage:
        // public class ProductDTO {
        //     @IsNumber
        //     private String price;
        //
        //     @IsNumber
        //     private String quantity;
        // }

        // Example 5: Data Import Validation
        // @Component
        // public class CSVImportService {
        //     @Autowired
        //     private ValidationService validationService;
        //
        //     public List<ValidationError> validateCSV(List<Map<String, String>> rows) {
        //         List<ValidationError> errors = new ArrayList<>();
        //
        //         for (int i = 0; i < rows.size(); i++) {
        //             Map<String, String> row = rows.get(i);
        //
        //             if (!validationService.isNumber(row.get("price"))) {
        //                 errors.add(new ValidationError(i, "price", "Invalid number"));
        //             }
        //
        //             if (!validationService.isNumber(row.get("quantity"))) {
        //                 errors.add(new ValidationError(i, "quantity", "Invalid number"));
        //             }
        //         }
        //
        //         return errors;
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Spring Boot API parameter validation");
        System.out.println("- Bean validation custom constraints");
        System.out.println("- CSV/JSON import data validation");
        System.out.println("- Configuration validation");
        System.out.println("- Form data sanitization");
        System.out.println();

        System.out.println("Example: Microservices Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide is-number (TypeScript)     │");
        System.out.println("│   elide-is-number.ts               │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same validation everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Apache Commons Validator + JS isNumber = inconsistent rules");
        System.out.println("After: One Elide implementation = 100% consistent validation");
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
        System.out.println();
        System.out.println("      @Bean");
        System.out.println("      public ValidationService validationService(Context context) {");
        System.out.println("          return new ValidationService(context);");
        System.out.println("      }");
        System.out.println("  }");
        System.out.println();

        System.out.println("Edge Cases Handled:");
        System.out.println("  ✓ NaN → false");
        System.out.println("  ✓ Infinity → false");
        System.out.println("  ✓ Numeric strings → true");
        System.out.println("  ✓ null → false");
        System.out.println("  ✓ Booleans → false");
        System.out.println();

        System.out.println("Performance Benefits:");
        System.out.println("- GraalVM JIT optimization");
        System.out.println("- Zero cold start overhead");
        System.out.println("- Shared runtime across services");
        System.out.println("- Native image compilation support");
    }
}
