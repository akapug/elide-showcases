import org.graalvm.polyglot.*;

public class ElideObjectHashExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Object Hash ===\n");
        System.out.println("Real-world use case: Generate cache keys for Java services");
        System.out.println("When Elide Java API is ready:");
        System.out.println("  Value hashModule = context.eval(\"js\", \"require('./elide-object-hash.ts')\");");
        System.out.println("  String cacheKey = hashModule.getMember(\"default\").execute(dataMap).asString();");
    }
}
