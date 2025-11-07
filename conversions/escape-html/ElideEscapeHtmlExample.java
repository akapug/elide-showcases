/**
 * Java Integration Example for elide-escape-html (HTML Entity Escaper)
 *
 * Demonstrates calling the TypeScript escape-html implementation from Java
 * for consistent XSS protection across JVM services.
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideEscapeHtmlExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Escape HTML ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value escapeHtml = context.eval("js", "require('./elide-escape-html.ts')");

        // Example 1: Basic HTML escaping
        // String dangerous = "<script>alert('XSS')</script>";
        // String safe = escapeHtml.invokeMember("escape", dangerous).asString();
        // System.out.println("Dangerous: " + dangerous);
        // System.out.println("Safe: " + safe);
        // // Output: &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;

        // Example 2: Spring Boot REST API with XSS protection
        // @RestController
        // @RequestMapping("/api/comments")
        // public class CommentController {
        //     private final Value escapeHtml;
        //
        //     public CommentController(Context graalContext) {
        //         this.escapeHtml = graalContext.eval("js",
        //             "require('./elide-escape-html.ts')");
        //     }
        //
        //     @PostMapping
        //     public ResponseEntity<Comment> createComment(@RequestBody CommentRequest req) {
        //         // Use TypeScript HTML escaper from Java
        //         String safeBody = escapeHtml.invokeMember("escape", req.getBody())
        //                                     .asString();
        //
        //         Comment comment = commentService.save(new Comment(safeBody));
        //         return ResponseEntity.ok(comment);
        //     }
        // }

        // Example 3: Servlet with HTML sanitization
        // @WebServlet("/submit")
        // public class SubmitServlet extends HttpServlet {
        //     private Value escapeHtml;
        //
        //     @Override
        //     public void init() {
        //         Context context = Context.newBuilder("js")
        //             .allowAllAccess(true)
        //             .build();
        //         escapeHtml = context.eval("js", "require('./elide-escape-html.ts')");
        //     }
        //
        //     @Override
        //     protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        //         String userInput = req.getParameter("content");
        //
        //         // Escape using same implementation as Node.js
        //         String safe = escapeHtml.invokeMember("escape", userInput).asString();
        //
        //         // Store and render safely
        //         database.save(safe);
        //         resp.getWriter().write("<div>" + safe + "</div>");
        //     }
        // }

        // Example 4: Email template generation
        // public class EmailService {
        //     private final Value escapeHtml;
        //
        //     public EmailService(Value escapeHtml) {
        //         this.escapeHtml = escapeHtml;
        //     }
        //
        //     public void sendWelcomeEmail(User user) {
        //         // Escape user data for HTML email
        //         String safeName = escapeHtml.invokeMember("escape", user.getName())
        //                                     .asString();
        //         String safeEmail = escapeHtml.invokeMember("escape", user.getEmail())
        //                                      .asString();
        //
        //         String htmlBody = String.format(
        //             "<html><body>" +
        //             "<h1>Welcome, %s!</h1>" +
        //             "<p>Your email: %s</p>" +
        //             "</body></html>",
        //             safeName, safeEmail
        //         );
        //
        //         emailClient.send(user.getEmail(), "Welcome", htmlBody);
        //     }
        // }

        // Example 5: Thymeleaf template with sanitization
        // @Controller
        // public class ProfileController {
        //     @Autowired
        //     private Value escapeHtml;
        //
        //     @GetMapping("/profile/{id}")
        //     public String viewProfile(@PathVariable Long id, Model model) {
        //         User user = userService.findById(id);
        //
        //         // Escape all user-generated content
        //         model.addAttribute("name",
        //             escapeHtml.invokeMember("escape", user.getName()).asString());
        //         model.addAttribute("bio",
        //             escapeHtml.invokeMember("escape", user.getBio()).asString());
        //
        //         return "profile";
        //     }
        // }

        // Example 6: JAX-RS API with XSS protection
        // @Path("/users")
        // public class UserResource {
        //     @Inject
        //     private Value escapeHtml;
        //
        //     @GET
        //     @Path("/{id}")
        //     @Produces(MediaType.APPLICATION_JSON)
        //     public Response getUser(@PathParam("id") Long id) {
        //         User user = userService.findById(id);
        //
        //         // Sanitize all fields
        //         UserDTO dto = new UserDTO();
        //         dto.setName(escapeHtml.invokeMember("escape", user.getName()).asString());
        //         dto.setBio(escapeHtml.invokeMember("escape", user.getBio()).asString());
        //         dto.setWebsite(escapeHtml.invokeMember("escape", user.getWebsite()).asString());
        //
        //         return Response.ok(dto).build();
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot service receives user input");
        System.out.println("- Uses same HTML escaper as Node.js frontend");
        System.out.println("- Guarantees identical XSS protection across platform");
        System.out.println();

        System.out.println("Example: Microservices XSS Protection");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Escape HTML (TypeScript)   │");
        System.out.println("│   conversions/escape-html/*.ts     │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Python │");
        System.out.println("    │Frontend│  │  API   │  │Worker  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("     All services use same escape() function");
        System.out.println("     ✓ Perfect XSS prevention consistency!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Apache Commons Text vs Node.js escaping = inconsistencies");
        System.out.println("After: One Elide implementation = unified security");
        System.out.println();

        System.out.println("Security Example:");
        System.out.println("  // User input");
        System.out.println("  String userInput = \"<img src=x onerror=alert(1)>\";");
        System.out.println("  ");
        System.out.println("  // Escape using shared implementation");
        System.out.println("  String safe = escapeHtml.invokeMember(\"escape\", userInput).asString();");
        System.out.println("  // Result: &lt;img src=x onerror=alert(1)&gt;");
        System.out.println("  ");
        System.out.println("  // Same escaping in Node.js, Python, Ruby, Java!");
        System.out.println("  // ✓ Unified security standard = fewer vulnerabilities");
    }
}
