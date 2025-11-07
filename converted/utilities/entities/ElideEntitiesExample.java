/**
 * Java Integration Example for elide-entities
 *
 * This demonstrates calling the TypeScript HTML entities implementation from Java
 * using Elide's polyglot capabilities.
 *
 * Benefits:
 * - One entity encoder shared across TypeScript and Java
 * - Consistent HTML safety across all JVM services
 * - No Apache Commons Text needed
 * - Perfect for Spring Boot, JSP, template engines
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is ready

public class ElideEntitiesExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript HTML Entities ===\n");

        // Example: Load TypeScript module
        // Context context = Polyglot.getContext();
        // Value entitiesModule = context.eval("js", "require('./elide-entities.ts')");

        // Example 1: Encode user input
        // String userInput = "<script>alert('XSS')</script>";
        // String safe = entitiesModule.getMember("encode").execute(userInput).asString();
        // System.out.println("Safe: " + safe);

        // Example 2: Spring Boot Controller
        // @RestController
        // public class CommentController {
        //     private final Value entitiesModule;
        //
        //     @PostMapping("/comment")
        //     public ResponseEntity<String> handleComment(@RequestBody String comment) {
        //         String safeComment = entitiesModule.getMember("escapeHTML")
        //             .execute(comment)
        //             .asString();
        //
        //         return ResponseEntity.ok()
        //             .header("Content-Type", "text/html; charset=utf-8")
        //             .body("<div>" + safeComment + "</div>");
        //     }
        // }

        // Example 3: Template Engine Integration
        // @Service
        // public class TemplateService {
        //     private final Value entitiesModule;
        //
        //     public String renderTemplate(String template, Map<String, String> data) {
        //         // Encode all user data before rendering
        //         Map<String, String> safeData = data.entrySet().stream()
        //             .collect(Collectors.toMap(
        //                 Map.Entry::getKey,
        //                 e -> entitiesModule.getMember("escapeHTML")
        //                     .execute(e.getValue())
        //                     .asString()
        //             ));
        //
        //         return renderWithData(template, safeData);
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot encodes user content for XSS prevention");
        System.out.println("- Uses same TypeScript implementation as Node.js frontend");
        System.out.println("- Guarantees consistent HTML safety across platform");
        System.out.println();

        System.out.println("Example: Web Platform");
        System.out.println("┌─────────────────────────────────────────────┐");
        System.out.println("│   Elide HTML Entities (TypeScript)         │");
        System.out.println("│   elide-entities.ts                        │");
        System.out.println("└─────────────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different encoding = potential XSS gaps");
        System.out.println("After: One Elide implementation = unified security");
    }
}
