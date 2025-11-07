/**
 * Java Integration Example for elide-kebabcase
 * This demonstrates calling the TypeScript kebab-case implementation from Java.
 * Benefits: Consistent URL slug generation across TypeScript and Java services.
 */

public class ElideKebabCaseExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript kebab-case ===\n");

        // Example: Spring Boot Slug Generation
        // @Service
        // public class SlugService {
        //     private final Value kebabCaseModule;
        //
        //     public String generateSlug(String title) {
        //         return kebabCaseModule.getMember("default")
        //             .execute(title)
        //             .asString();
        //     }
        // }
        //
        // @Entity
        // public class Post {
        //     @PrePersist
        //     public void generateSlug() {
        //         this.slug = slugService.generateSlug(this.title);
        //     }
        // }

        System.out.println("Real-world use cases:");
        System.out.println("- Spring Boot URL slug generation");
        System.out.println("- CSS class name generation");
        System.out.println("- File name generation");
        System.out.println("- API endpoint naming");
        System.out.println();

        System.out.println("When Elide Java API is ready:");
        System.out.println("  kebabCase.getMember(\"default\").execute(\"HelloWorld\")");
        System.out.println("  // Returns: 'hello-world'");
    }
}
