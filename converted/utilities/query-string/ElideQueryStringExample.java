/**
 * Java Integration Example for elide-query-string (URL Query String Parser)
 *
 * Demonstrates calling the TypeScript query-string implementation from Java
 * for consistent URL parameter handling across JVM microservices.
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;
// import java.util.Map;

public class ElideQueryStringExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Query String Parser ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value qs = context.eval("js", "require('./elide-query-string.ts')");

        // Example 1: Parse URL query string
        // String query = "name=Bob&age=25&role=developer&active=true";
        // Value parsed = qs.invokeMember("parse", query);
        // System.out.println("Query: " + query);
        // System.out.println("Parsed: " + parsed);
        // // Output: {name: "Bob", age: 25, role: "developer", active: true}

        // Example 2: Stringify parameters
        // Map<String, Object> params = Map.of(
        //     "search", "java elide",
        //     "page", 1,
        //     "limit", 50
        // );
        // String queryString = qs.invokeMember("stringify", params).asString();
        // System.out.println("Parameters: " + params);
        // System.out.println("Query string: " + queryString);
        // // Output: search=java%20elide&page=1&limit=50

        // Example 3: Handle arrays (consistent with Node.js!)
        // String arrayQuery = "tags=java&tags=kotlin&tags=scala";
        // Value arrayParsed = qs.invokeMember("parse", arrayQuery);
        // System.out.println("Array query: " + arrayQuery);
        // System.out.println("Parsed: " + arrayParsed);
        // // Output: {tags: ["java", "kotlin", "scala"]}

        // Example 4: Spring Boot REST controller
        // @RestController
        // @RequestMapping("/api/products")
        // public class ProductController {
        //     @Autowired
        //     private Value qsParser;
        //
        //     @GetMapping
        //     public ResponseEntity<List<Product>> getProducts(HttpServletRequest request) {
        //         // Parse query string same way as Node.js Express!
        //         String queryString = request.getQueryString();
        //         Value params = qsParser.invokeMember("parse", queryString);
        //
        //         String category = params.getMember("category").asString();
        //         List<String> brands = params.getMember("brands").as(List.class);
        //         int minPrice = params.getMember("minPrice").asInt();
        //         int maxPrice = params.getMember("maxPrice").asInt();
        //
        //         List<Product> products = productService.findByFilters(
        //             category, brands, minPrice, maxPrice
        //         );
        //
        //         return ResponseEntity.ok(products);
        //     }
        // }

        // Example 5: JAX-RS resource
        // @Path("/api/search")
        // public class SearchResource {
        //     @Inject
        //     private Value qsParser;
        //
        //     @GET
        //     @Produces(MediaType.APPLICATION_JSON)
        //     public Response search(@Context UriInfo uriInfo) {
        //         String queryString = uriInfo.getRequestUri().getQuery();
        //         Value params = qsParser.invokeMember("parse", queryString);
        //
        //         String q = params.getMember("q").asString();
        //         List<String> filters = params.getMember("filters").as(List.class);
        //         int page = params.getMember("page").asInt();
        //
        //         SearchResults results = searchService.search(q, filters, page);
        //         return Response.ok(results).build();
        //     }
        // }

        // Example 6: HTTP client with consistent params
        // public class ApiClient {
        //     private final Value qsParser;
        //     private final HttpClient httpClient;
        //
        //     public ApiClient(Value qsParser) {
        //         this.qsParser = qsParser;
        //         this.httpClient = HttpClient.newHttpClient();
        //     }
        //
        //     public String callService(String endpoint, Map<String, Object> params) {
        //         // Build query string using same logic as Node.js client
        //         Map<String, Object> options = Map.of(
        //             "arrayFormat", "bracket",
        //             "sort", true
        //         );
        //         String query = qsParser.invokeMember("stringify", params, options).asString();
        //         String url = "https://api.example.com/" + endpoint + "?" + query;
        //
        //         HttpRequest request = HttpRequest.newBuilder()
        //             .uri(URI.create(url))
        //             .GET()
        //             .build();
        //
        //         try {
        //             HttpResponse<String> response = httpClient.send(
        //                 request,
        //                 HttpResponse.BodyHandlers.ofString()
        //             );
        //             return response.body();
        //         } catch (Exception e) {
        //             throw new RuntimeException(e);
        //         }
        //     }
        // }
        //
        // // Usage
        // ApiClient client = new ApiClient(qsParser);
        // String results = client.callService("search", Map.of(
        //     "q", "elide",
        //     "filters", List.of("polyglot", "runtime"),
        //     "page", 1,
        //     "limit", 20
        // ));

        // Example 7: Micronaut controller
        // @Controller("/api/users")
        // public class UserController {
        //     @Inject
        //     Value qsParser;
        //
        //     @Get
        //     public HttpResponse<List<User>> getUsers(@QueryValue String queryString) {
        //         Value params = qsParser.invokeMember("parse", queryString);
        //
        //         // Same parsing as Node.js/Python/Ruby services!
        //         List<String> roles = params.getMember("roles").as(List.class);
        //         boolean active = params.getMember("active").asBoolean();
        //         int limit = params.getMember("limit").asInt();
        //
        //         List<User> users = userService.findByRolesAndActive(roles, active, limit);
        //         return HttpResponse.ok(users);
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot API reads query: ?brands[]=nike&brands[]=adidas&page=1");
        System.out.println("- Uses same query-string parser as Node.js/Python/Ruby APIs");
        System.out.println("- Guarantees identical parameter parsing across entire platform");
        System.out.println();

        System.out.println("Example: Cross-Language API Consistency");
        System.out.println("┌──────────────────────────────────────┐");
        System.out.println("│  Elide Query String (TypeScript)    │");
        System.out.println("│  conversions/query-string/           │");
        System.out.println("└──────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓           ↓");
        System.out.println("    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐");
        System.out.println("    │ Node.js │ │  Java   │ │ Python  │ │  Ruby   │");
        System.out.println("    │ Express │ │ Spring  │ │ Flask   │ │ Sinatra │");
        System.out.println("    └─────────┘ └─────────┘ └─────────┘ └─────────┘");
        System.out.println("     GET /api/search?q=shoes&brands[]=nike&brands[]=adidas");
        System.out.println("     All four parse identically:");
        System.out.println("     { q: 'shoes', brands: ['nike', 'adidas'] }");
        System.out.println("     ✓ Perfect consistency across the entire stack!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Each language/framework parses query strings differently");
        System.out.println("  - Node.js (qs): Custom nested object and array handling");
        System.out.println("  - Java (Spring): @RequestParam different behavior for arrays");
        System.out.println("  - Python (Flask): request.args.getlist() for arrays");
        System.out.println("  - Ruby (Rack): Rack::Utils.parse_nested_query() different");
        System.out.println("  - Result: Same query = different parsed objects = BUGS");
        System.out.println();
        System.out.println("After: One Elide implementation = identical parsing everywhere");
        System.out.println("  - All languages use same TypeScript parser");
        System.out.println("  - Same options, same behavior, same results");
        System.out.println("  - Zero query parameter inconsistency bugs across services");
        System.out.println();

        System.out.println("Configuration Example:");
        System.out.println("  // application.yml (shared by all services)");
        System.out.println("  queryParsing:");
        System.out.println("    arrayFormat: bracket   # brands[]=a&brands[]=b");
        System.out.println("    parseNumbers: true     # page=1 → number");
        System.out.println("    parseBooleans: true    # active=true → boolean");
        System.out.println("    sort: true             # alphabetical keys");
        System.out.println("  ");
        System.out.println("  // All services use identical settings:");
        System.out.println("  params = qs.parse(queryString, config);");
        System.out.println();

        System.out.println("Use Cases:");
        System.out.println("  ✓ REST API parameter parsing (Spring Boot, JAX-RS, Micronaut)");
        System.out.println("  ✓ Microservice URL building (consistent with Node.js/Python/Ruby)");
        System.out.println("  ✓ Search/filter query handling (arrays, nested objects, pagination)");
        System.out.println("  ✓ HTTP client query strings (API calls to other services)");
        System.out.println("  ✓ API gateway parameter forwarding (parse once, use everywhere)");
        System.out.println();
    }
}
