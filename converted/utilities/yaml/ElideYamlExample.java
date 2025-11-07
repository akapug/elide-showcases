/**
 * Java Integration Example for elide-yaml
 *
 * This demonstrates calling the TypeScript YAML parser from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One YAML parser shared across TypeScript and Java
 * - Consistent config parsing across Spring Boot and Node.js
 * - Support for complex YAML features
 * - Perfect for Kubernetes operators, Spring configs
 */

import org.graalvm.polyglot.*;
import java.nio.file.*;
import java.io.IOException;

public class ElideYamlExample {

    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript YAML Parser ===\n");

        // NOTE: Exact syntax depends on Elide's Java polyglot API
        // This is a CONCEPTUAL example using GraalVM polyglot API

        // Example 1: Parse Spring Boot application.yml
        try (Context context = Context.create()) {
            // Load the YAML module
            // Value yamlModule = context.eval("js",
            //     "require('./elide-yaml.ts')");

            // String appConfig = """
            // spring:
            //   application:
            //     name: myapp
            //   datasource:
            //     url: jdbc:postgresql://localhost:5432/mydb
            //     username: admin
            //   """;

            // Value config = yamlModule.getMember("parseYAML")
            //     .execute(appConfig);

            // Value spring = config.getMember("spring");
            // Value app = spring.getMember("application");
            // System.out.println("App name: " + app.getMember("name").asString());

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }

        // Example 2: Kubernetes ConfigMap Parser
        // class K8sConfigMapParser {
        //     private Context polyglotContext;
        //     private Value yamlParser;
        //
        //     public K8sConfigMapParser() {
        //         this.polyglotContext = Context.create();
        //         this.yamlParser = polyglotContext.eval("js",
        //             "require('./elide-yaml.ts')");
        //     }
        //
        //     public Value parseConfigMap(String filepath) throws IOException {
        //         String content = Files.readString(Path.of(filepath));
        //         return yamlParser.getMember("parseYAML").execute(content);
        //     }
        //
        //     public String getConfigMapName(Value configMap) {
        //         return configMap.getMember("metadata")
        //             .getMember("name")
        //             .asString();
        //     }
        //
        //     public void close() {
        //         polyglotContext.close();
        //     }
        // }

        // Example 3: CI/CD Pipeline Configuration
        // class CIPipelineConfig {
        //     private Value config;
        //
        //     public CIPipelineConfig(Context context, String yamlPath)
        //             throws IOException {
        //         Value yamlModule = context.eval("js",
        //             "require('./elide-yaml.ts')");
        //         String content = Files.readString(Path.of(yamlPath));
        //         this.config = yamlModule.getMember("parseYAML")
        //             .execute(content);
        //     }
        //
        //     public Value getStages() {
        //         return config.getMember("stages");
        //     }
        //
        //     public Value getJobs(String stage) {
        //         return config.getMember("jobs").getMember(stage);
        //     }
        // }

        // Example 4: Docker Compose Parser
        // class DockerComposeParser {
        //     public static Value parse(Context context, String filepath)
        //             throws IOException {
        //         Value yamlModule = context.eval("js",
        //             "require('./elide-yaml.ts')");
        //         String content = Files.readString(Path.of(filepath));
        //         return yamlModule.getMember("parseYAML").execute(content);
        //     }
        //
        //     public static List<String> getServiceNames(Value compose) {
        //         Value services = compose.getMember("services");
        //         List<String> names = new ArrayList<>();
        //         for (String key : services.getMemberKeys()) {
        //             names.add(key);
        //         }
        //         return names;
        //     }
        // }

        // Example 5: Application Configuration Loader
        // class AppConfigLoader {
        //     private Value config;
        //
        //     public AppConfigLoader(Context context, String configPath)
        //             throws IOException {
        //         Value yamlModule = context.eval("js",
        //             "require('./elide-yaml.ts')");
        //         String content = Files.readString(Path.of(configPath));
        //         this.config = yamlModule.getMember("parseYAML")
        //             .execute(content);
        //     }
        //
        //     public String getString(String... keys) {
        //         Value current = config;
        //         for (String key : keys) {
        //             current = current.getMember(key);
        //         }
        //         return current.asString();
        //     }
        //
        //     public int getInt(String... keys) {
        //         Value current = config;
        //         for (String key : keys) {
        //             current = current.getMember(key);
        //         }
        //         return current.asInt();
        //     }
        // }

        System.out.println("""

            USE CASES FOR YAML IN JAVA:
            ============================
            1. Spring Boot Configuration - application.yml parsing
            2. Kubernetes Operators - Parse K8s resource definitions
            3. CI/CD Integration - GitHub Actions, GitLab CI configs
            4. Docker Compose - Multi-container orchestration
            5. Infrastructure as Code - Ansible, Terraform configs
            6. API Specifications - OpenAPI/Swagger definitions
            7. Build Configs - Maven, Gradle plugins
            8. Feature Flags - Environment-specific settings

            PERFORMANCE BENEFITS:
            ====================
            - GraalVM's JIT compilation makes parsing extremely fast
            - Shared parser across languages reduces code duplication
            - Consistent behavior prevents parsing bugs
            - Single source of truth for YAML parsing
            - Near-native performance via GraalVM
            """);
    }
}
