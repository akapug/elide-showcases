/**
 * Java Integration Example for elide-strip-ansi
 */

public class ElideStripAnsiExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Strip ANSI ===\n");

        // Value stripAnsi = context.eval("js", "require('./elide-strip-ansi.ts')");
        // String log = "\u001b[32mINFO\u001b[0m Server started";
        // String clean = stripAnsi.getMember("strip")
        //     .execute(log)
        //     .asString();
        // System.out.println(clean);  // "INFO Server started"

        System.out.println("Real-world use case:");
        System.out.println("- Java service processes colored logs");
        System.out.println("- Uses same TypeScript implementation as Node.js");
        System.out.println("- Consistent ANSI stripping across platform");
    }
}
