import org.graalvm.polyglot.*;

/**
 * Pad Left - Java Integration Example
 */
public class ElidePadLeftExample {
    public static void main(String[] args) {
        System.out.println("⬅️  Pad Left - Java Integration\n");

        try (Context ctx = Context.newBuilder("js").allowAllAccess(true).build()) {
            String code = "function padLeft(s, w, c=' ') { s=String(s); return s.length>=w ? s : c.repeat(w-s.length)+s; } ({ default: padLeft })";
            Value module = ctx.eval("js", code);
            Value padLeft = module.getMember("default");

            String num = padLeft.execute(5, 3, "0").asString();
            System.out.println("Zero-padded: " + num);

            for (int i = 1; i <= 5; i++) {
                String filename = "file" + padLeft.execute(i, 3, "0").asString() + ".jpg";
                System.out.println(filename);
            }

            System.out.println("\n💡 Use Cases:");
            System.out.println("- File naming sequences");
            System.out.println("- Log line numbers");
            System.out.println("- Table alignment");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
