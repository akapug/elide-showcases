/**
 * Java Integration Example for elide-validator
 *
 * This demonstrates calling the TypeScript validator implementation from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One validation implementation shared across TypeScript and Java
 * - Consistent validation rules across all JVM services
 * - No Java validation library needed (or can supplement it)
 * - Perfect for Spring Boot, Micronaut, Quarkus
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideValidatorExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Validator ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value validator = context.eval("js",
        //     "const module = require('./elide-validator.ts'); module;");

        // Example 1: Email Validation
        // String email = "user@example.com";
        // boolean isValid = validator.getMember("isEmail")
        //     .execute(email)
        //     .asBoolean();
        // System.out.println("Email valid: " + isValid);
        // System.out.println();

        // Example 2: Spring Boot REST Controller
        // @RestController
        // @RequestMapping("/api/users")
        // public class UserController {
        //     private final Value validator;
        //
        //     public UserController(Context graalContext) {
        //         this.validator = graalContext.eval("js",
        //             "require('./elide-validator.ts')");
        //     }
        //
        //     @PostMapping
        //     public ResponseEntity<?> createUser(@RequestBody UserDto user) {
        //         // Validate email
        //         if (!validator.getMember("isEmail")
        //                 .execute(user.getEmail())
        //                 .asBoolean()) {
        //             return ResponseEntity.badRequest()
        //                 .body(Map.of("error", "Invalid email"));
        //         }
        //
        //         // Validate URL
        //         if (!validator.getMember("isURL")
        //                 .execute(user.getWebsite())
        //                 .asBoolean()) {
        //             return ResponseEntity.badRequest()
        //                 .body(Map.of("error", "Invalid website URL"));
        //         }
        //
        //         // Validate phone
        //         if (!validator.getMember("isMobilePhone")
        //                 .execute(user.getPhone())
        //                 .asBoolean()) {
        //             return ResponseEntity.badRequest()
        //                 .body(Map.of("error", "Invalid phone number"));
        //         }
        //
        //         return ResponseEntity.ok(userService.create(user));
        //     }
        // }

        // Example 3: Payment Processing Service
        // @Service
        // public class PaymentService {
        //     private final Value validator;
        //
        //     public PaymentService(Context graalContext) {
        //         this.validator = graalContext.eval("js",
        //             "require('./elide-validator.ts')");
        //     }
        //
        //     public boolean processPayment(PaymentRequest payment) {
        //         // Validate credit card using Luhn algorithm
        //         boolean cardValid = validator.getMember("isCreditCard")
        //             .execute(payment.getCardNumber())
        //             .asBoolean();
        //
        //         if (!cardValid) {
        //             throw new InvalidCardException("Invalid credit card number");
        //         }
        //
        //         // Validate email
        //         boolean emailValid = validator.getMember("isEmail")
        //             .execute(payment.getEmail())
        //             .asBoolean();
        //
        //         if (!emailValid) {
        //             throw new InvalidEmailException("Invalid email address");
        //         }
        //
        //         // Process payment
        //         return paymentGateway.charge(payment);
        //     }
        // }

        // Example 4: JPA Entity Validation
        // @Entity
        // public class User {
        //     @Id
        //     @GeneratedValue
        //     private Long id;
        //
        //     private String email;
        //     private String website;
        //     private String phone;
        //
        //     @PrePersist
        //     @PreUpdate
        //     public void validate() {
        //         ValidatorService validatorService =
        //             ApplicationContext.getBean(ValidatorService.class);
        //
        //         if (!validatorService.isValidEmail(email)) {
        //             throw new ValidationException("Invalid email");
        //         }
        //
        //         if (website != null && !validatorService.isValidUrl(website)) {
        //             throw new ValidationException("Invalid website URL");
        //         }
        //     }
        // }

        // Example 5: IP Whitelist Security Filter
        // @Component
        // public class IpWhitelistFilter implements Filter {
        //     private final Value validator;
        //     private final List<String> whitelist;
        //
        //     public IpWhitelistFilter(Context graalContext) {
        //         this.validator = graalContext.eval("js",
        //             "require('./elide-validator.ts')");
        //         this.whitelist = Arrays.asList(
        //             "192.168.1.1",
        //             "10.0.0.1"
        //         );
        //     }
        //
        //     @Override
        //     public void doFilter(ServletRequest request,
        //                          ServletResponse response,
        //                          FilterChain chain) {
        //         String ipAddress = request.getRemoteAddr();
        //
        //         // Validate IP format
        //         boolean isValidIp = validator.getMember("isIP")
        //             .execute(ipAddress, 4)
        //             .asBoolean();
        //
        //         if (!isValidIp || !whitelist.contains(ipAddress)) {
        //             throw new SecurityException("IP not whitelisted: " + ipAddress);
        //         }
        //
        //         chain.doFilter(request, response);
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot API validates user registration");
        System.out.println("- Payment service validates credit cards with Luhn");
        System.out.println("- Uses same TypeScript implementation as React frontend");
        System.out.println("- Guarantees consistent validation across entire platform");
        System.out.println();

        System.out.println("Example: Enterprise Microservices");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Validator (TypeScript)     │");
        System.out.println("│   conversions/validator/            │");
        System.out.println("│   elide-validator.ts                │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same validation rules everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Frontend validators + Java validators = inconsistent rules");
        System.out.println("After: One Elide implementation = 100% consistent validation");
        System.out.println();

        System.out.println("Security Benefits:");
        System.out.println("- Unified XSS prevention with escape()");
        System.out.println("- Consistent email/URL validation prevents injection");
        System.out.println("- Credit card validation with Luhn algorithm");
        System.out.println("- No frontend/backend validation discrepancies");
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
        System.out.println("      public Value validator(Context context) {");
        System.out.println("          return context.eval(\"js\",");
        System.out.println("              \"require('./elide-validator.ts')\");");
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
