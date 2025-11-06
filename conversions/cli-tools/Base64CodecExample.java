/**
 * Java Integration Example for Base64 Codec
 *
 * This demonstrates calling the TypeScript base64-codec implementation from Java
 * using Elide's polyglot capabilities.
 *
 * Benefits:
 * - One Base64 implementation shared across TypeScript and Java
 * - URL-safe encoding consistency across JVM services
 * - Unified validation across all platforms
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class Base64CodecExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Base64 Codec ===\n");

        // Example: Load TypeScript module
        // Context context = Context.newBuilder("js").build();
        // Value codec = context.eval("js", "require('./base64-codec.ts')");

        // Example 1: Encode string
        // String text = "Hello, Elide!";
        // String encoded = codec.getMember("encode").execute(text).asString();
        // System.out.println("Encoded: " + encoded);

        // Example 2: Decode string
        // String decoded = codec.getMember("decode").execute(encoded).asString();
        // System.out.println("Decoded: " + decoded);

        // Example 3: URL-safe encoding
        // String urlText = "test+data/value=";
        // String urlEncoded = codec.getMember("encodeURL").execute(urlText).asString();
        // System.out.println("URL-safe: " + urlEncoded);

        // Example 4: Use in Spring Boot
        // @Service
        // public class TokenService {
        //     private final Value codec;
        //
        //     public String encodeToken(String data) {
        //         return codec.getMember("encodeURL").execute(data).asString();
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java services encode API tokens");
        System.out.println("- Uses same TypeScript implementation as frontend");
        System.out.println("- Guarantees identical encoding across platform");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Java Base64.Encoder + JavaScript btoa = different implementations");
        System.out.println("After: One Elide implementation = consistent encoding everywhere");
    }
}
