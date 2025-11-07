/**
 * Java Integration Example for elide-diff
 *
 * This demonstrates calling the TypeScript diff implementation from Java
 * using Elide's polyglot capabilities.
 *
 * Benefits:
 * - One diff library shared across TypeScript and Java
 * - Consistent text comparison across all JVM services
 * - No Java diff library needed for many cases
 * - Perfect for version control, document comparison
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is ready

public class ElideDiffExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Diff Library ===\n");

        // Example: Load TypeScript module
        // Context context = Polyglot.getContext();
        // Value diffModule = context.eval("js", "require('./elide-diff.ts')");

        // Example 1: Compare two documents
        // String oldText = "Hello World\nThis is a test\nGoodbye";
        // String newText = "Hello World\nThis is modified\nGoodbye";
        // Value diff = diffModule.getMember("diffLines").execute(oldText, newText);

        // Example 2: Spring Boot Version Control
        // @Service
        // public class DocumentVersionService {
        //     private final Value diffModule;
        //
        //     public String compareVersions(Long docId, int v1, int v2) {
        //         String oldContent = getDocumentVersion(docId, v1);
        //         String newContent = getDocumentVersion(docId, v2);
        //
        //         return diffModule.getMember("createPatch")
        //             .execute("document.txt", oldContent, newContent)
        //             .asString();
        //     }
        //
        //     public double calculateSimilarity(String text1, String text2) {
        //         return diffModule.getMember("calculateSimilarity")
        //             .execute(text1, text2)
        //             .asDouble();
        //     }
        // }

        // Example 3: Code Review System
        // @RestController
        // public class CodeReviewController {
        //     private final Value diffModule;
        //
        //     @GetMapping("/review/{prId}/diff")
        //     public ResponseEntity<String> getFileDiff(@PathVariable Long prId, @RequestParam String file) {
        //         PullRequest pr = prService.findById(prId);
        //         String oldContent = pr.getBaseContent(file);
        //         String newContent = pr.getHeadContent(file);
        //
        //         String patch = diffModule.getMember("createPatch")
        //             .execute(file, oldContent, newContent)
        //             .asString();
        //
        //         return ResponseEntity.ok(patch);
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service compares document versions");
        System.out.println("- Uses same TypeScript implementation as Node.js editor");
        System.out.println("- Guarantees consistent diff format");
        System.out.println();

        System.out.println("Example: Document Management");
        System.out.println("┌─────────────────────────────────────────────┐");
        System.out.println("│   Elide Diff (TypeScript)                  │");
        System.out.println("│   elide-diff.ts                            │");
        System.out.println("└─────────────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │ Editor │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different diff implementations = inconsistent output");
        System.out.println("After: One Elide implementation = unified diffs");
    }
}
