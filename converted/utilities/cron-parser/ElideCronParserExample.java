/**
 * Java Integration Example for elide-cron-parser
 */

public class ElideCronParserExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Cron Parser ===\n");

        // Value cron = context.eval("js", "require('./elide-cron-parser.ts')");
        // String next = cron.getMember("getNextExecution")
        //     .execute("0 12 * * *")
        //     .asString();

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring scheduler needs cron parsing");
        System.out.println("- Uses same TypeScript implementation as Node.js");
        System.out.println("- Consistent scheduling across platform");
    }
}
