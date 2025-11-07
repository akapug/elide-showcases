import org.graalvm.polyglot.*;

/**
 * Pluralize - Java Integration Example
 */
public class ElidePluralizeExample {
    public static void main(String[] args) {
        System.out.println("📝 Pluralize - Java Integration Example\n");

        try (Context context = Context.newBuilder("js").allowAllAccess(true).build()) {
            // Simplified pluralize implementation
            String code = """
                const irregulars = { person: 'people', child: 'children', foot: 'feet' };
                function pluralize(word, count) {
                    if (count === 1) return word;
                    if (irregulars[word.toLowerCase()]) return irregulars[word.toLowerCase()];
                    if (word.match(/s$/)) return word;
                    if (word.match(/([^aeiou])y$/)) return word.replace(/y$/, 'ies');
                    if (word.match(/(x|ch|ss|sh)$/)) return word + 'es';
                    return word + 's';
                }
                ({ default: pluralize })
            """;

            Value module = context.eval("js", code);
            Value pluralize = module.getMember("default");

            System.out.println("=== Example 1: Spring Boot Response Messages ===");
            String[][] tests = {
                {"user", "1"}, {"user", "5"},
                {"item", "1"}, {"item", "10"},
                {"person", "1"}, {"person", "3"}
            };

            for (String[] test : tests) {
                String word = test[0];
                int count = Integer.parseInt(test[1]);
                String result = pluralize.execute(word, count).asString();
                System.out.println(count + " " + result);
            }
            System.out.println();

            System.out.println("💡 Use Cases:");
            System.out.println("- REST API messages");
            System.out.println("- JPA entity names");
            System.out.println("- Form labels");
            System.out.println("- Email templates");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
