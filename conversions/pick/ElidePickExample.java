import org.graalvm.polyglot.*;

public class ElidePickExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Pick ===\n");
        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot apps create DTOs");
        System.out.println("- Uses same TypeScript implementation as Node.js service");
        System.out.println("- Consistent data projection across entire stack");
        System.out.println();
        System.out.println("When Elide Java API is ready, usage will be:");
        System.out.println("  Value pickModule = context.eval(\"js\", \"require('./elide-pick.ts')\");");
        System.out.println("  Value dto = pickModule.getMember(\"default\").execute(user, \"id\", \"username\", \"email\");");
    }
}
