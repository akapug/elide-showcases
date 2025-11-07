import org.graalvm.polyglot.*;

/**
 * Truncate - Java Integration Example
 */
public class ElideTruncateExample {
    public static void main(String[] args) {
        System.out.println("✂️  Truncate - Java Integration\n");

        try (Context ctx = Context.newBuilder("js").allowAllAccess(true).build()) {
            String code = "function truncate(s, len, sfx='...') { return s.length <= len ? s : s.slice(0, len-sfx.length)+sfx; } ({ default: truncate })";
            Value module = ctx.eval("js", code);
            Value truncate = module.getMember("default");

            String text = "The quick brown fox jumps over the lazy dog";
            String result = truncate.execute(text, 20).asString();
            System.out.println("Result: " + result);

            System.out.println("\n💡 Use Cases:");
            System.out.println("- Spring Boot DTOs");
            System.out.println("- Email templates");
            System.out.println("- API responses");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
