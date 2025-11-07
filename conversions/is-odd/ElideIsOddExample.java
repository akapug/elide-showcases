/**
 * Java Integration Example for elide-is-odd
 *
 * This demonstrates calling the TypeScript is-odd implementation
 * from Java using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One is-odd implementation shared across TypeScript and Java
 * - Consistent odd/even validation across all JVM services
 * - No Java % operator edge case issues
 * - Perfect for Spring Boot validations, algorithms
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideIsOddExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript is-odd ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value isOddModule = context.eval("js",
        //     "const module = require('./elide-is-odd.ts'); module;");

        // Example 1: Bean Validation
        // @Service
        // public class UserService {
        //     private final Value isOddModule;
        //
        //     public UserService(Context graalContext) {
        //         this.isOddModule = graalContext.eval("js",
        //             "require('./elide-is-odd.ts')");
        //     }
        //
        //     public void validateUserId(Long userId) {
        //         boolean isOdd = isOddModule.getMember("default")
        //             .execute(userId)
        //             .asBoolean();
        //
        //         if (!isOdd) {
        //             throw new ValidationException("User ID must be odd");
        //         }
        //     }
        // }

        // Example 2: Stream Filtering
        // @Service
        // public class DataProcessor {
        //     private final Value isOddModule;
        //
        //     public DataProcessor(Context graalContext) {
        //         this.isOddModule = graalContext.eval("js",
        //             "require('./elide-is-odd.ts')");
        //     }
        //
        //     public List<Integer> filterOddNumbers(List<Integer> numbers) {
        //         return numbers.stream()
        //             .filter(n -> isOddModule.getMember("default")
        //                 .execute(n)
        //                 .asBoolean())
        //             .collect(Collectors.toList());
        //     }
        //
        //     public void processData() {
        //         List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        //         List<Integer> oddNumbers = filterOddNumbers(numbers);
        //         System.out.println("Odd numbers: " + oddNumbers);
        //         // => [1, 3, 5, 7, 9]
        //     }
        // }

        // Example 3: REST Controller with Validation
        // @RestController
        // @RequestMapping("/api/users")
        // public class UserController {
        //     private final Value isOddModule;
        //     private final UserRepository userRepository;
        //
        //     public UserController(Context graalContext, UserRepository userRepository) {
        //         this.isOddModule = graalContext.eval("js",
        //             "require('./elide-is-odd.ts')");
        //         this.userRepository = userRepository;
        //     }
        //
        //     @GetMapping("/odd-ids")
        //     public ResponseEntity<List<User>> getUsersWithOddIds() {
        //         List<User> allUsers = userRepository.findAll();
        //         List<User> oddIdUsers = allUsers.stream()
        //             .filter(u -> isOddModule.getMember("default")
        //                 .execute(u.getId())
        //                 .asBoolean())
        //             .collect(Collectors.toList());
        //         return ResponseEntity.ok(oddIdUsers);
        //     }
        // }

        // Example 4: Pagination Helper
        // @Component
        // public class PaginationHelper {
        //     private final Value isOddModule;
        //
        //     public PaginationHelper(Context graalContext) {
        //         this.isOddModule = graalContext.eval("js",
        //             "require('./elide-is-odd.ts')");
        //     }
        //
        //     public String getPageClass(int pageNumber) {
        //         boolean isOdd = isOddModule.getMember("default")
        //             .execute(pageNumber)
        //             .asBoolean();
        //         return isOdd ? "odd-page" : "even-page";
        //     }
        //
        //     public void printPagination() {
        //         for (int page = 1; page <= 10; page++) {
        //             System.out.println("Page " + page + ": " + getPageClass(page));
        //         }
        //     }
        // }

        // Example 5: Batch Processing Strategy
        // @Service
        // public class BatchProcessor {
        //     private final Value isOddModule;
        //
        //     public BatchProcessor(Context graalContext) {
        //         this.isOddModule = graalContext.eval("js",
        //             "require('./elide-is-odd.ts')");
        //     }
        //
        //     public void processBatch(Long batchId, List<Data> data) {
        //         boolean isOdd = isOddModule.getMember("default")
        //             .execute(batchId)
        //             .asBoolean();
        //
        //         ProcessingStrategy strategy = isOdd ?
        //             ProcessingStrategy.FAST :
        //             ProcessingStrategy.THOROUGH;
        //
        //         processWithStrategy(data, strategy);
        //     }
        //
        //     private void processWithStrategy(List<Data> data,
        //                                       ProcessingStrategy strategy) {
        //         // Implementation
        //     }
        // }

        // Example 6: Custom Validator Annotation
        // @Component
        // public class OddNumberValidator implements ConstraintValidator<OddNumber, Integer> {
        //     private Value isOddModule;
        //
        //     @Autowired
        //     public void setGraalContext(Context context) {
        //         this.isOddModule = context.eval("js",
        //             "require('./elide-is-odd.ts')");
        //     }
        //
        //     @Override
        //     public boolean isValid(Integer value, ConstraintValidatorContext context) {
        //         if (value == null) return true;
        //         return isOddModule.getMember("default")
        //             .execute(value)
        //             .asBoolean();
        //     }
        // }
        //
        // // Usage:
        // public class UserDto {
        //     @OddNumber(message = "User ID must be odd")
        //     private Integer userId;
        // }

        System.out.println("Real-world use cases:");
        System.out.println("- Bean validation and constraints");
        System.out.println("- Stream filtering and processing");
        System.out.println("- Pagination UI logic");
        System.out.println("- Batch processing strategies");
        System.out.println("- REST API validation");
        System.out.println("- Algorithm implementations");
        System.out.println();

        System.out.println("Example: Microservices Platform");
        System.out.println("┌──────────────────────────────────────┐");
        System.out.println("│   Elide is-odd (TypeScript)         │");
        System.out.println("│   elide-is-odd.ts                   │");
        System.out.println("└──────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same validation everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Java % operator + JS % operator = potential edge cases");
        System.out.println("After: One Elide implementation = consistent odd/even detection");
        System.out.println();

        System.out.println("Spring Boot Integration (when ready):");
        System.out.println("  @Configuration");
        System.out.println("  public class ElideConfig {");
        System.out.println("      @Bean");
        System.out.println("      public Value isOddModule(Context context) {");
        System.out.println("          return context.eval(\"js\",");
        System.out.println("              \"require('./elide-is-odd.ts')\");");
        System.out.println("      }");
        System.out.println("  }");
        System.out.println();

        System.out.println("Performance Benefits:");
        System.out.println("- GraalVM JIT optimization");
        System.out.println("- Zero overhead for simple operations");
        System.out.println("- Shared runtime across services");
        System.out.println("- Consistent validation logic");
        System.out.println();

        System.out.println("Edge Cases Handled:");
        System.out.println("- Negative numbers: isOdd(-3) -> true");
        System.out.println("- Zero: isOdd(0) -> false");
        System.out.println("- Non-integers: isOdd(3.5) -> false");
        System.out.println("- Large numbers: isOdd(999999999) -> true");
    }
}
