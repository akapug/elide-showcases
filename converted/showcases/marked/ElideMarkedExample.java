/**
 * Java Integration Example for elide-marked (Markdown Parser)
 *
 * Demonstrates calling the TypeScript marked implementation from Java
 * for consistent markdown rendering across JVM-based documentation services.
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideMarkedExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Marked ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value markedModule = context.eval("js", "require('./elide-marked.ts')");

        // Example 1: Parse markdown to HTML
        // String markdown = "# Hello World\n\nThis is **bold** and *italic*.";
        // String html = markedModule.getMember("default").execute(markdown).asString();
        // System.out.println("Markdown: " + markdown);
        // System.out.println("HTML: " + html);
        // Output: <h1 id="hello-world">Hello World</h1>\n\n<p>This is <strong>bold</strong> and <em>italic</em>.</p>

        // Example 2: Spring Boot documentation endpoint
        // @RestController
        // @RequestMapping("/api/docs")
        // public class DocsController {
        //     private final Value markedModule;
        //
        //     public DocsController(Context graalContext) {
        //         this.markedModule = graalContext.eval("js", "require('./elide-marked.ts')");
        //     }
        //
        //     @GetMapping("/{docId}")
        //     public ResponseEntity<DocResponse> getDoc(@PathVariable String docId) {
        //         // Load markdown from database
        //         String markdown = docRepository.findById(docId).getContent();
        //
        //         // Render using same parser as Node.js docs site!
        //         String html = markedModule.getMember("default").execute(markdown).asString();
        //
        //         return ResponseEntity.ok(new DocResponse(html, markdown));
        //     }
        // }

        // Example 3: README rendering for Maven repository
        // public class MavenReadmeRenderer {
        //     private final Value marked;
        //
        //     public MavenReadmeRenderer(Value markedModule) {
        //         this.marked = markedModule.getMember("default");
        //     }
        //
        //     public String renderPackageReadme(String groupId, String artifactId) {
        //         String readmeMd = fetchReadmeFromMaven(groupId, artifactId);
        //
        //         // Same rendering as npm registry and PyPI!
        //         return marked.execute(readmeMd).asString();
        //     }
        // }

        // Example 4: Confluence-like wiki with markdown
        // @Service
        // public class WikiService {
        //     @Autowired
        //     private Value markedModule;
        //
        //     public WikiPage renderPage(Long pageId) {
        //         WikiPage page = wikiRepository.findById(pageId).orElseThrow();
        //
        //         // Convert markdown to HTML
        //         String html = markedModule.getMember("default").execute(
        //             page.getMarkdownContent()
        //         ).asString();
        //
        //         page.setHtmlContent(html);
        //         return page;
        //     }
        // }

        // Example 5: Custom options for GFM
        // Map<String, Object> options = new HashMap<>();
        // options.put("gfm", true);           // GitHub Flavored Markdown
        // options.put("breaks", false);        // Disable line breaks
        // options.put("headerIds", true);      // Generate header IDs
        // options.put("headerPrefix", "doc-");
        //
        // Value optionsValue = context.asValue(options);
        // String html = markedModule.getMember("default").execute(markdown, optionsValue).asString();

        System.out.println("Real-world use case:");
        System.out.println("- Java docs service reads markdown from database");
        System.out.println("- Uses same marked parser as Node.js, Python, Ruby");
        System.out.println("- Guarantees identical HTML output across entire platform");
        System.out.println();

        System.out.println("Example: Unified Documentation Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Marked (TypeScript)        │");
        System.out.println("│   conversions/marked/elide-marked.ts│");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Python │");
        System.out.println("    │  Docs  │  │ Spring │  │  API   │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("     All services render markdown identically");
        System.out.println("     ✓ Perfect consistency!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: commonmark-java vs marked.js = different HTML");
        System.out.println("After: One Elide implementation = identical rendering");
        System.out.println();

        System.out.println("Benefits:");
        System.out.println("  ✓ Consistent markdown rendering across Java, Python, Ruby, Node.js");
        System.out.println("  ✓ Same HTML output for README files");
        System.out.println("  ✓ No markdown parsing bugs between languages");
        System.out.println("  ✓ GitHub Flavored Markdown support everywhere");
        System.out.println("  ✓ Perfect for Spring Boot CMS with markdown content");
    }
}
