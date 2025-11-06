/**
 * Java Integration Example for elide-base64
 *
 * Demonstrates calling the TypeScript base64 implementation from Java
 * for consistent encoding/decoding across JVM services.
 *
 * Perfect for:
 * - Spring Boot authentication services
 * - JWT token handling
 * - API token generation
 * - HTTP Basic Auth
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideBase64Example {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Base64 ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value base64Module = context.eval("js", "require('./elide-base64.ts')");

        // Example 1: HTTP Basic Auth
        // String username = "api_user";
        // String password = "secret_key_123";
        // String credentials = username + ":" + password;
        // String encoded = base64Module.invokeMember("encode", credentials).asString();
        // System.out.println("Basic Auth: Basic " + encoded);
        // String decoded = base64Module.invokeMember("decode", encoded).asString();
        // System.out.println("Decoded: " + decoded);
        // System.out.println();

        // Example 2: Spring Boot Authentication Filter
        // @Component
        // public class BasicAuthFilter extends OncePerRequestFilter {
        //     private final Value base64Module;
        //
        //     public BasicAuthFilter(Context graalContext) {
        //         this.base64Module = graalContext.eval("js", "require('./elide-base64.ts')");
        //     }
        //
        //     @Override
        //     protected void doFilterInternal(
        //         HttpServletRequest request,
        //         HttpServletResponse response,
        //         FilterChain filterChain
        //     ) throws ServletException, IOException {
        //         String authHeader = request.getHeader("Authorization");
        //
        //         if (authHeader != null && authHeader.startsWith("Basic ")) {
        //             String encoded = authHeader.substring(6);
        //             String decoded = base64Module.invokeMember("decode", encoded).asString();
        //             String[] credentials = decoded.split(":");
        //
        //             // Authenticate using same base64 decoder as Node.js API
        //             Authentication auth = authenticateUser(credentials[0], credentials[1]);
        //             SecurityContextHolder.getContext().setAuthentication(auth);
        //         }
        //
        //         filterChain.doFilter(request, response);
        //     }
        // }

        // Example 3: JWT Token Service
        // @Service
        // public class JwtTokenService {
        //     private final Value base64Module;
        //
        //     @Autowired
        //     public JwtTokenService(Context graalContext) {
        //         this.base64Module = graalContext.eval("js", "require('./elide-base64.ts')");
        //     }
        //
        //     public String generateToken(Long userId, String scope) {
        //         String tokenData = String.format(
        //             "%d:%d:%s",
        //             userId,
        //             System.currentTimeMillis(),
        //             scope
        //         );
        //         return base64Module.invokeMember("encode", tokenData, true).asString();
        //     }
        //
        //     public TokenInfo validateToken(String token) {
        //         try {
        //             String decoded = base64Module.invokeMember("decode", token, true).asString();
        //             String[] parts = decoded.split(":");
        //             return new TokenInfo(
        //                 Long.parseLong(parts[0]),
        //                 Long.parseLong(parts[1]),
        //                 parts[2]
        //             );
        //         } catch (Exception e) {
        //             return null;
        //         }
        //     }
        // }

        // Example 4: REST Template with Basic Auth
        // @Configuration
        // public class RestTemplateConfig {
        //     private final Value base64Module;
        //
        //     public RestTemplateConfig(Context graalContext) {
        //         this.base64Module = graalContext.eval("js", "require('./elide-base64.ts')");
        //     }
        //
        //     @Bean
        //     public RestTemplate restTemplate() {
        //         RestTemplate template = new RestTemplate();
        //
        //         // Add interceptor for Basic Auth
        //         template.getInterceptors().add((request, body, execution) -> {
        //             String credentials = "api_user:secret_key";
        //             String encoded = base64Module.invokeMember("encode", credentials).asString();
        //             request.getHeaders().add("Authorization", "Basic " + encoded);
        //             return execution.execute(request, body);
        //         });
        //
        //         return template;
        //     }
        // }

        // Example 5: Data URL Generator
        // @Service
        // public class ImageService {
        //     private final Value base64Module;
        //
        //     @Autowired
        //     public ImageService(Context graalContext) {
        //         this.base64Module = graalContext.eval("js", "require('./elide-base64.ts')");
        //     }
        //
        //     public String createDataUrl(byte[] imageBytes, String mimeType) {
        //         String encoded = base64Module.invokeMember("encode", imageBytes).asString();
        //         return String.format("data:%s;base64,%s", mimeType, encoded);
        //     }
        //
        //     public byte[] fromDataUrl(String dataUrl) {
        //         String base64Part = dataUrl.split(",")[1];
        //         String decoded = base64Module.invokeMember("decode", base64Part).asString();
        //         return decoded.getBytes();
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service encodes HTTP Basic Auth headers");
        System.out.println("- Uses same base64 implementation as Node.js API");
        System.out.println("- Guarantees identical token encoding across platform");
        System.out.println("- Perfect for Spring Boot microservices");
        System.out.println();

        System.out.println("Example: Microservices Configuration");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Base64 (TypeScript)        │");
        System.out.println("│   conversions/base64/elide-base64  │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Python │");
        System.out.println("    │  API   │  │ Spring │  │  Auth  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("     All services encode tokens identically");
        System.out.println("     ✓ Perfect consistency!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Each language uses different base64 implementations");
        System.out.println("  - Java: Base64.getEncoder().encodeToString()");
        System.out.println("  - Node.js: Buffer.toString('base64')");
        System.out.println("  - Result: Potential padding/URL-safety mismatches");
        System.out.println();
        System.out.println("After: One Elide implementation = identical encoding");
        System.out.println("  - Same algorithm across all services");
        System.out.println("  - Consistent URL-safe encoding");
        System.out.println("  - Zero token validation errors");
    }
}
