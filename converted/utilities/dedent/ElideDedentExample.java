/**
 * Java Integration Example for elide-dedent
 *
 * This demonstrates calling the TypeScript dedent implementation
 * from Java using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One dedent implementation shared across TypeScript and Java
 * - Consistent string formatting across all JVM services
 * - No Java text-block indentation workarounds needed
 * - Perfect for Spring Boot SQL queries, templates
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

// Assuming Elide/GraalVM provides:
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideDedentExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Dedent ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value dedentModule = context.eval("js",
        //     "const module = require('./elide-dedent.ts'); module;");

        // Example 1: SQL Query Formatting
        // @Repository
        // public class UserRepository {
        //     private final Value dedentModule;
        //
        //     public UserRepository(Context graalContext) {
        //         this.dedentModule = graalContext.eval("js",
        //             "require('./elide-dedent.ts')");
        //     }
        //
        //     public String getActiveUsersQuery() {
        //         String query = dedentModule.getMember("default")
        //             .execute("""
        //                 SELECT u.id, u.username, u.email, COUNT(p.id) as post_count
        //                 FROM users u
        //                 LEFT JOIN posts p ON p.user_id = u.id
        //                 WHERE u.active = true
        //                 GROUP BY u.id
        //                 ORDER BY post_count DESC
        //             """)
        //             .asString();
        //         return query;
        //     }
        // }

        // Example 2: Email Template Service
        // @Service
        // public class EmailService {
        //     private final Value dedentModule;
        //
        //     public EmailService(Context graalContext) {
        //         this.dedentModule = graalContext.eval("js",
        //             "require('./elide-dedent.ts')");
        //     }
        //
        //     public String generateWelcomeEmail(User user) {
        //         String template = dedentModule.getMember("default")
        //             .execute(String.format("""
        //                 Hello %s!
        //
        //                 Welcome to our platform. We're excited to have you.
        //
        //                 Your account details:
        //                 - Email: %s
        //                 - Username: %s
        //
        //                 Best regards,
        //                 The Team
        //             """, user.getName(), user.getEmail(), user.getUsername()))
        //             .asString();
        //         return template;
        //     }
        // }

        // Example 3: Configuration File Generator
        // @Service
        // public class ConfigService {
        //     private final Value dedentModule;
        //
        //     public ConfigService(Context graalContext) {
        //         this.dedentModule = graalContext.eval("js",
        //             "require('./elide-dedent.ts')");
        //     }
        //
        //     public String generateApplicationYaml(String profile) {
        //         String config = dedentModule.getMember("default")
        //             .execute(String.format("""
        //                 spring:
        //                   profiles:
        //                     active: %s
        //                   datasource:
        //                     url: jdbc:postgresql://localhost:5432/mydb
        //                     username: admin
        //                     password: secret
        //                   jpa:
        //                     hibernate:
        //                       ddl-auto: update
        //             """, profile))
        //             .asString();
        //         return config;
        //     }
        // }

        // Example 4: REST API Documentation
        // @RestController
        // @RequestMapping("/api/users")
        // public class UserController {
        //     private final Value dedentModule;
        //
        //     public UserController(Context graalContext) {
        //         this.dedentModule = graalContext.eval("js",
        //             "require('./elide-dedent.ts')");
        //     }
        //
        //     @GetMapping
        //     @ApiOperation(value = """
        //         Get all users
        //
        //         Returns a list of all active users with their details.
        //         Supports pagination via query parameters.
        //     """)
        //     public ResponseEntity<List<User>> getUsers() {
        //         // Clean up description with dedent
        //         String cleanDoc = dedentModule.getMember("default")
        //             .execute("""
        //                 Get all users
        //
        //                 Returns a list of all active users with their details.
        //                 Supports pagination via query parameters.
        //             """)
        //             .asString();
        //         // Return users
        //         return ResponseEntity.ok(users);
        //     }
        // }

        // Example 5: Test Data Generation
        // @Service
        // public class TestDataService {
        //     private final Value dedentModule;
        //
        //     public TestDataService(Context graalContext) {
        //         this.dedentModule = graalContext.eval("js",
        //             "require('./elide-dedent.ts')");
        //     }
        //
        //     public String generateTestJsonPayload() {
        //         String json = dedentModule.getMember("default")
        //             .execute("""
        //                 {
        //                   "users": [
        //                     {
        //                       "id": 1,
        //                       "name": "Alice",
        //                       "email": "alice@example.com"
        //                     },
        //                     {
        //                       "id": 2,
        //                       "name": "Bob",
        //                       "email": "bob@example.com"
        //                     }
        //                   ]
        //                 }
        //             """)
        //             .asString();
        //         return json;
        //     }
        // }

        System.out.println("Real-world use cases:");
        System.out.println("- Spring Boot SQL query formatting");
        System.out.println("- Email template generation");
        System.out.println("- Configuration file creation");
        System.out.println("- API documentation strings");
        System.out.println("- Test data and fixture generation");
        System.out.println("- Multi-line string literals");
        System.out.println();

        System.out.println("Example: Microservices Platform");
        System.out.println("┌──────────────────────────────────────┐");
        System.out.println("│   Elide Dedent (TypeScript)         │");
        System.out.println("│   elide-dedent.ts                   │");
        System.out.println("└──────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same clean strings everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Java text blocks + JS dedent = different edge cases");
        System.out.println("After: One Elide implementation = consistent formatting");
        System.out.println();

        System.out.println("Spring Boot Integration (when ready):");
        System.out.println("  @Configuration");
        System.out.println("  public class ElideConfig {");
        System.out.println("      @Bean");
        System.out.println("      public Value dedentModule(Context context) {");
        System.out.println("          return context.eval(\"js\",");
        System.out.println("              \"require('./elide-dedent.ts')\");");
        System.out.println("      }");
        System.out.println("  }");
        System.out.println();

        System.out.println("Performance Benefits:");
        System.out.println("- GraalVM JIT optimization");
        System.out.println("- Zero cold start overhead");
        System.out.println("- Shared runtime across services");
        System.out.println("- Consistent text processing");
    }
}
