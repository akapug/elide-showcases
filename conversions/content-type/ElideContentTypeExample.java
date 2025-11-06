/**
 * Java Integration Example for elide-content-type
 *
 * This demonstrates calling the TypeScript Content-Type implementation from Java
 * using Elide's polyglot capabilities.
 *
 * Benefits:
 * - One Content-Type parser shared across TypeScript and Java
 * - Consistent header handling across all JVM services
 * - No Java content-type library needed
 * - Perfect for Spring Boot, JAX-RS, Servlet containers
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is ready

// Assuming Elide/GraalVM provides:
// import dev.elide.runtime.Polyglot;
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideContentTypeExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Content-Type Parser ===\n");

        // Example: Load TypeScript module
        // Context context = Polyglot.getContext();
        // Value contentTypeModule = context.eval("js", "require('./elide-content-type.ts')");

        // Example 1: Parse Content-Type Header
        // String header = "application/json; charset=utf-8";
        // Value parsed = contentTypeModule.getMember("parse").execute(header);
        // System.out.println("Type: " + parsed.getMember("type").asString());
        // System.out.println("Charset: " + parsed.getMember("parameters").getMember("charset").asString());
        // System.out.println();

        // Example 2: Format Content-Type
        // Value ct = context.eval("js", "({ type: 'application/json', parameters: { charset: 'utf-8' } })");
        // String formatted = contentTypeModule.getMember("format").execute(ct).asString();
        // System.out.println("Formatted: " + formatted);
        // System.out.println();

        // Example 3: Spring Boot REST Controller
        // @RestController
        // @RequestMapping("/api")
        // public class DataController {
        //     private final Value contentTypeModule;
        //
        //     public DataController(Context context) {
        //         this.contentTypeModule = context.eval("js", "require('./elide-content-type.ts')");
        //     }
        //
        //     @PostMapping("/data")
        //     public ResponseEntity<String> handleData(
        //         @RequestHeader("Content-Type") String contentType,
        //         @RequestBody String body
        //     ) {
        //         // Parse Content-Type
        //         Value ct = contentTypeModule.getMember("parse").execute(contentType);
        //         boolean isJson = contentTypeModule.getMember("isJSON").execute(ct).asBoolean();
        //
        //         if (isJson) {
        //             // Process JSON
        //             return ResponseEntity.ok()
        //                 .header("Content-Type", "application/json; charset=utf-8")
        //                 .body("{\"status\":\"ok\"}");
        //         }
        //
        //         return ResponseEntity.badRequest().build();
        //     }
        // }

        // Example 4: JAX-RS Resource
        // @Path("/api")
        // public class ApiResource {
        //     @Context
        //     private HttpHeaders headers;
        //
        //     private final Value contentTypeModule;
        //
        //     @POST
        //     @Path("/data")
        //     public Response handleData(String body) {
        //         String ctHeader = headers.getHeaderString("Content-Type");
        //         Value ct = contentTypeModule.getMember("parse").execute(ctHeader);
        //
        //         boolean isJson = contentTypeModule.getMember("isJSON").execute(ct).asBoolean();
        //         if (isJson) {
        //             return Response.ok("{\"status\":\"ok\"}")
        //                 .header("Content-Type", "application/json; charset=utf-8")
        //                 .build();
        //         }
        //
        //         return Response.status(400).build();
        //     }
        // }

        // Example 5: Content Negotiation Service
        // @Service
        // public class ContentNegotiationService {
        //     private final Value contentTypeModule;
        //
        //     public ContentNegotiationService(Context context) {
        //         this.contentTypeModule = context.eval("js", "require('./elide-content-type.ts')");
        //     }
        //
        //     public String negotiateContentType(String acceptHeader) {
        //         // Simple negotiation - prefer JSON
        //         if (acceptHeader.contains("application/json")) {
        //             Value ct = context.eval("js",
        //                 "({ type: 'application/json', parameters: { charset: 'utf-8' } })");
        //             return contentTypeModule.getMember("format").execute(ct).asString();
        //         }
        //
        //         // Default to JSON
        //         return "application/json; charset=utf-8";
        //     }
        //
        //     public boolean isJsonRequest(String contentTypeHeader) {
        //         Value ct = contentTypeModule.getMember("parse").execute(contentTypeHeader);
        //         return contentTypeModule.getMember("isJSON").execute(ct).asBoolean();
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot service handles Content-Type for APIs");
        System.out.println("- Uses same TypeScript implementation as Node.js gateway");
        System.out.println("- Guarantees consistent content negotiation across platform");
        System.out.println();

        System.out.println("Example: API Platform");
        System.out.println("┌─────────────────────────────────────────────┐");
        System.out.println("│   Elide Content-Type (TypeScript)          │");
        System.out.println("│   elide-content-type.ts                    │");
        System.out.println("└─────────────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Spring │");
        System.out.println("    │Gateway │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different Content-Type parsing across services");
        System.out.println("After: One Elide implementation = consistent everywhere");
    }
}
