import org.graalvm.polyglot.*;

public class ElideExtendShallowExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Extend Shallow ===\n");
        System.out.println("Real-world use case: Merge Spring Boot properties");
        System.out.println("When Elide Java API is ready:");
        System.out.println("  Value extendModule = context.eval(\"js\", \"require('./elide-extend-shallow.ts')\");");
        System.out.println("  Value config = extendModule.getMember(\"default\").execute(defaults, userOpts);");
    }
}
