/**
 * Java Integration Example for elide-json5
 *
 * This demonstrates calling the TypeScript JSON5 parser from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One JSON5 parser shared across TypeScript and Java
 * - Consistent config file parsing across Spring Boot and Node.js services
 * - Support for comments and trailing commas in configs
 * - Perfect for microservices, configuration management
 */

import org.graalvm.polyglot.*;

public class ElideJson5Example {

    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript JSON5 Parser ===\n");

        // NOTE: Exact syntax depends on Elide's Java polyglot API
        // This is a CONCEPTUAL example using GraalVM polyglot API

        // Example 1: Parse Configuration with Comments
        try (Context context = Context.create()) {
            // Load the JSON5 module
            // Value json5Module = context.eval("js",
            //     "require('./elide-json5.ts')");

            // String configText = """
            // {
            //     // Server configuration
            //     "host": "localhost",
            //     "port": 8080,
            //     "ssl": {
            //         "enabled": true,
            //         "keystore": "/path/to/keystore",
            //     }
            // }
            // """;

            // Value config = json5Module.getMember("parse")
            //     .execute(configText);

            // System.out.println("Host: " + config.getMember("host").asString());
            // System.out.println("Port: " + config.getMember("port").asInt());

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }

        // Example 2: Spring Boot Configuration Loader
        // class SpringConfigLoader {
        //     private Context polyglotContext;
        //     private Value json5Parser;
        //
        //     public SpringConfigLoader() {
        //         this.polyglotContext = Context.create();
        //         this.json5Parser = polyglotContext.eval("js",
        //             "require('./elide-json5.ts')");
        //     }
        //
        //     public Value loadConfig(String filepath) throws IOException {
        //         String content = Files.readString(Path.of(filepath));
        //         return json5Parser.getMember("parse").execute(content);
        //     }
        //
        //     public String getString(Value config, String key) {
        //         return config.getMember(key).asString();
        //     }
        //
        //     public int getInt(Value config, String key) {
        //         return config.getMember(key).asInt();
        //     }
        //
        //     public void close() {
        //         polyglotContext.close();
        //     }
        // }

        // Example 3: Parse API Response
        // String apiResponse = """
        // {
        //     users: [
        //         {name: "Alice", age: 30},
        //         {name: "Bob", age: 25},
        //     ],
        // }
        // """;
        //
        // Value data = json5Module.getMember("parse").execute(apiResponse);
        // Value users = data.getMember("users");
        // System.out.println("User count: " + users.getArraySize());

        // Example 4: Feature Flag Manager
        // class FeatureFlagManager {
        //     private Value flags;
        //
        //     public FeatureFlagManager(Context context, String configPath)
        //             throws IOException {
        //         Value json5Module = context.eval("js",
        //             "require('./elide-json5.ts')");
        //         String content = Files.readString(Path.of(configPath));
        //         this.flags = json5Module.getMember("parse").execute(content);
        //     }
        //
        //     public boolean isEnabled(String flag) {
        //         if (flags.hasMember(flag)) {
        //             return flags.getMember(flag).asBoolean();
        //         }
        //         return false;
        //     }
        // }
        //
        // FeatureFlagManager ffManager = new FeatureFlagManager(
        //     context, "config/features.json5");
        // if (ffManager.isEnabled("darkMode")) {
        //     System.out.println("Dark mode is enabled");
        // }

        // Example 5: Database Configuration
        // class DatabaseConfig {
        //     public String host;
        //     public int port;
        //     public String database;
        //
        //     public static DatabaseConfig load(Context context, String path)
        //             throws IOException {
        //         Value json5Module = context.eval("js",
        //             "require('./elide-json5.ts')");
        //         String content = Files.readString(Path.of(path));
        //         Value config = json5Module.getMember("parse").execute(content);
        //
        //         DatabaseConfig dbConfig = new DatabaseConfig();
        //         dbConfig.host = config.getMember("host").asString();
        //         dbConfig.port = config.getMember("port").asInt();
        //         dbConfig.database = config.getMember("database").asString();
        //
        //         return dbConfig;
        //     }
        // }

        System.out.println("""

            USE CASES FOR JSON5 IN JAVA:
            ============================
            1. Spring Boot Configuration - Parse configs with comments
            2. Microservices Config - Share config format with Node.js services
            3. Feature Flags - Config-driven feature toggles
            4. Build Configs - Maven/Gradle config in JSON5
            5. API Responses - Parse JSON5 from external APIs
            6. Settings Management - Load app settings with docs
            7. Environment Configs - Per-environment settings
            8. Data Exchange - Share config between Java and TypeScript

            PERFORMANCE BENEFITS:
            ====================
            - GraalVM's JIT compilation makes parsing extremely fast
            - Shared parser across languages reduces code duplication
            - Consistent behavior prevents parsing bugs
            - Single source of truth for JSON5 parsing
            - Near-native performance via GraalVM
            """);
    }
}
