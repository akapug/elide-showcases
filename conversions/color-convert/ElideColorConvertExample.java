/**
 * Java Integration Example for elide-color-convert
 *
 * This demonstrates calling the TypeScript color conversion implementation from Java
 * using Elide's polyglot capabilities via GraalVM.
 *
 * Benefits:
 * - One color conversion implementation shared across TypeScript and Java
 * - Consistent color handling across all JVM services
 * - No Java color library complexity
 * - Perfect for Spring Boot UI theming, image processing
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// This is a CONCEPTUAL example - adjust when Java support is documented

public class ElideColorConvertExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Color Convert ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js").allowAllAccess(true).build();
        // Value color = context.eval("js", "require('./elide-color-convert.ts')");

        // Example 1: RGB to HEX
        // String hex = color.getMember("rgbToHex")
        //     .execute(new int[]{255, 0, 0})
        //     .asString();
        // System.out.println("RGB(255,0,0) -> " + hex);  // #ff0000

        // Example 2: Spring Boot theme service
        // @Service
        // public class ThemeService {
        //     private final Value color;
        //
        //     public ThemeService(Context graalContext) {
        //         this.color = graalContext.eval("js",
        //             "require('./elide-color-convert.ts')");
        //     }
        //
        //     public Map<String, String> generateTheme(String primaryHex) {
        //         int[] rgb = color.getMember("hexToRgb")
        //             .execute(primaryHex)
        //             .as(int[].class);
        //
        //         int[] lightRgb = color.getMember("lighten")
        //             .execute(rgb, 20)
        //             .as(int[].class);
        //         String lightHex = color.getMember("rgbToHex")
        //             .execute(lightRgb)
        //             .asString();
        //
        //         int[] darkRgb = color.getMember("darken")
        //             .execute(rgb, 20)
        //             .as(int[].class);
        //         String darkHex = color.getMember("rgbToHex")
        //             .execute(darkRgb)
        //             .asString();
        //
        //         Map<String, String> theme = new HashMap<>();
        //         theme.put("primary", primaryHex);
        //         theme.put("light", lightHex);
        //         theme.put("dark", darkHex);
        //         return theme;
        //     }
        // }

        // Example 3: Image processing
        // @Service
        // public class ImageService {
        //     public BufferedImage adjustBrightness(BufferedImage img, int amount) {
        //         Value color = loadColorModule();
        //         BufferedImage result = new BufferedImage(
        //             img.getWidth(), img.getHeight(), img.getType());
        //
        //         for (int y = 0; y < img.getHeight(); y++) {
        //             for (int x = 0; x < img.getWidth(); x++) {
        //                 Color pixel = new Color(img.getRGB(x, y));
        //                 int[] rgb = {pixel.getRed(), pixel.getGreen(), pixel.getBlue()};
        //
        //                 int[] adjusted = amount > 0 ?
        //                     color.getMember("lighten").execute(rgb, amount).as(int[].class) :
        //                     color.getMember("darken").execute(rgb, -amount).as(int[].class);
        //
        //                 result.setRGB(x, y, new Color(
        //                     adjusted[0], adjusted[1], adjusted[2]).getRGB());
        //             }
        //         }
        //         return result;
        //     }
        // }

        // Example 4: REST API for color conversion
        // @RestController
        // @RequestMapping("/api/colors")
        // public class ColorController {
        //     @Autowired
        //     private Value colorConverter;
        //
        //     @GetMapping("/convert/rgb-to-hex")
        //     public ResponseEntity<String> rgbToHex(
        //         @RequestParam int r,
        //         @RequestParam int g,
        //         @RequestParam int b) {
        //
        //         String hex = colorConverter.getMember("rgbToHex")
        //             .execute(new int[]{r, g, b})
        //             .asString();
        //         return ResponseEntity.ok(hex);
        //     }
        //
        //     @GetMapping("/palette/{baseColor}")
        //     public ResponseEntity<PaletteDTO> generatePalette(
        //         @PathVariable String baseColor) {
        //
        //         int[] rgb = colorConverter.getMember("hexToRgb")
        //             .execute(baseColor).as(int[].class);
        //
        //         PaletteDTO palette = new PaletteDTO();
        //         palette.setBase(baseColor);
        //         palette.setLight(convertToHex(
        //             colorConverter.getMember("lighten").execute(rgb, 20)));
        //         palette.setDark(convertToHex(
        //             colorConverter.getMember("darken").execute(rgb, 20)));
        //
        //         return ResponseEntity.ok(palette);
        //     }
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java Spring Boot needs consistent color theming");
        System.out.println("- Uses same TypeScript implementation as React UI");
        System.out.println("- Guarantees identical colors across platform");
        System.out.println("- No java.awt.Color complexity");
        System.out.println();

        System.out.println("Example: Design System");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Color Convert (TypeScript) │");
        System.out.println("│   elide-color-convert.ts           │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ React  │  │  Java  │  │ Spring │");
        System.out.println("    │   UI   │  │Service │  │  Boot  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    Same color system everywhere!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Different color libs = UI and backend have different colors");
        System.out.println("After: One Elide implementation = perfect color consistency");
    }
}
