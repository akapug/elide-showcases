/**
 * Java Integration Example for elide-fast-json-stable-stringify
 */

public class ElideStableStringifyExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Stable Stringify ===\n");

        // Value stringify = context.eval("js",
        //     "require('./elide-fast-json-stable-stringify.ts')");
        //
        // Map<String, Object> data = new HashMap<>();
        // data.put("page", 1);
        // data.put("limit", 10);
        //
        // String json = stringify.execute(data).asString();
        // System.out.println("JSON: " + json);

        System.out.println("Real-world use case:");
        System.out.println("- Java service needs deterministic JSON");
        System.out.println("- Uses same TypeScript implementation as Node.js");
        System.out.println("- Consistent cache keys across platform");
    }
}
