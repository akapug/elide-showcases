/**
 * Java Integration Example for elide-cookie
 *
 * This demonstrates calling the TypeScript cookie implementation from Java
 * using Elide's polyglot capabilities.
 *
 * Benefits:
 * - One cookie parser shared across TypeScript and Java
 * - Consistent cookie handling across all JVM services
 * - No Java cookie library needed
 * - Perfect for Spring Boot, Servlet containers
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is ready

// Assuming Elide/GraalVM provides:
// import dev.elide.runtime.Polyglot;
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideCookieExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Cookie Parser ===\n");

        // Example: Load TypeScript module
        // Context context = Polyglot.getContext();
        // Value cookieModule = context.eval("js", "require('./elide-cookie.ts')");

        // Example 1: Parse Cookie Header
        // String cookieHeader = "session=abc123; user=john; theme=dark";
        // Value parsed = cookieModule.getMember("parse").execute(cookieHeader);
        // System.out.println("Cookie header: " + cookieHeader);
        // System.out.println("Parsed: " + parsed);
        // System.out.println();

        // Example 2: Serialize Cookie
        // Value options = context.eval("js", "({ path: '/', httpOnly: true, secure: true, maxAge: 3600 })");
        // String cookieStr = cookieModule.getMember("serialize")
        //     .execute("session", "abc123", options)
        //     .asString();
        // System.out.println("Set-Cookie: " + cookieStr);
        // System.out.println();

        // Example 3: Spring Boot Integration
        // @RestController
        // public class AuthController {
        //     private final Value cookieModule;
        //
        //     public AuthController(Context context) {
        //         this.cookieModule = context.eval("js", "require('./elide-cookie.ts')");
        //     }
        //
        //     @PostMapping("/login")
        //     public ResponseEntity<String> login(@RequestHeader("Cookie") String cookieHeader) {
        //         // Parse cookies
        //         Value cookies = cookieModule.getMember("parse").execute(cookieHeader);
        //
        //         // Create auth cookie
        //         Value options = context.eval("js",
        //             "({ httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 86400 })");
        //         String authCookie = cookieModule.getMember("serialize")
        //             .execute("auth_token", "jwt_token_here", options)
        //             .asString();
        //
        //         return ResponseEntity.ok()
        //             .header("Set-Cookie", authCookie)
        //             .body("Logged in");
        //     }
        // }

        // Example 4: Servlet Filter
        // public class CookieParsingFilter implements Filter {
        //     private final Value cookieModule;
        //
        //     @Override
        //     public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        //         HttpServletRequest httpRequest = (HttpServletRequest) request;
        //         String cookieHeader = httpRequest.getHeader("Cookie");
        //
        //         if (cookieHeader != null) {
        //             Value cookies = cookieModule.getMember("parse").execute(cookieHeader);
        //             httpRequest.setAttribute("parsedCookies", cookies);
        //         }
        //
        //         chain.doFilter(request, response);
        //     }
        // }

        // Example 5: Cookie Validation Service
        // @Service
        // public class CookieService {
        //     private final Value cookieModule;
        //
        //     public CookieService(Context context) {
        //         this.cookieModule = context.eval("js", "require('./elide-cookie.ts')");
        //     }
        //
        //     public Map<String, String> parseCookies(String cookieHeader) {
        //         Value parsed = cookieModule.getMember("parse").execute(cookieHeader);
        //         // Convert to Java Map
        //         return convertToMap(parsed);
        //     }
        //
        //     public String createAuthCookie(String token, int maxAge) {
        //         Value options = context.eval("js",
        //             String.format("({ httpOnly: true, secure: true, maxAge: %d })", maxAge));
        //         return cookieModule.getMember("serialize")
        //             .execute("auth_token", token, options)
        //             .asString();
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot service parses cookies for authentication");
        System.out.println("- Uses same TypeScript implementation as Node.js API");
        System.out.println("- Guarantees consistent cookie format across entire platform");
        System.out.println();

        System.out.println("Example: Polyglot Platform");
        System.out.println("┌─────────────────────────────────────────────┐");
        System.out.println("│   Elide Cookie (TypeScript)                │");
        System.out.println("│   conversions/cookie/elide-cookie.ts       │");
        System.out.println("└─────────────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │  API   │  │Gateway │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Java javax.servlet.http.Cookie + JavaScript cookie = different APIs");
        System.out.println("After: One Elide implementation = consistent cookies everywhere");
        System.out.println();

        System.out.println("Spring Boot Integration (when ready):");
        System.out.println("  @Configuration");
        System.out.println("  public class CookieConfig {");
        System.out.println("    @Bean");
        System.out.println("    public Value cookieModule(Context context) {");
        System.out.println("      return context.eval(\"js\", \"require('./elide-cookie.ts')\");");
        System.out.println("    }");
        System.out.println("  }");
    }
}
