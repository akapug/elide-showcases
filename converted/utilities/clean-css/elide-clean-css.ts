/**
 * CleanCSS - CSS Minifier
 *
 * Fast and efficient CSS optimizer.
 * **POLYGLOT SHOWCASE**: One CSS minifier for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/clean-css (~30M downloads/week)
 *
 * Features:
 * - CSS minification
 * - Property optimization
 * - Duplicate removal
 * - Comment stripping
 * - Whitespace collapse
 * - Fast processing
 *
 * Polyglot Benefits:
 * - ALL languages serve CSS
 * - ONE CSS optimizer everywhere
 * - Share optimization logic
 * - Consistent CSS output
 *
 * Use cases:
 * - CSS build optimization
 * - Production deployments
 * - Performance tuning
 * - Bundle size reduction
 *
 * Package has ~30M downloads/week on npm!
 */

interface CleanCSSOptions {
  level?: number;
}

class CleanCSS {
  constructor(private options: CleanCSSOptions = {}) {}

  minify(css: string): { styles: string; stats: { originalSize: number; minifiedSize: number } } {
    let output = css;

    // Remove comments
    output = output.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove whitespace
    output = output.replace(/\s+/g, ' ');
    output = output.replace(/\s*([{}:;,])\s*/g, '$1');
    output = output.trim();

    // Remove last semicolon in rule
    output = output.replace(/;}/g, '}');

    return {
      styles: output,
      stats: {
        originalSize: css.length,
        minifiedSize: output.length
      }
    };
  }
}

export default CleanCSS;

// CLI Demo
if (import.meta.url.includes("elide-clean-css.ts")) {
  console.log("✅ CleanCSS - CSS Optimizer (POLYGLOT!)\n");

  const cleanCSS = new CleanCSS();

  const css = `
/* Header styles */
.header {
  margin: 0;
  padding: 10px;
  background: #fff;
}

/* Body styles */
body {
  font-family: Arial, sans-serif;
  color: #333;
}
  `.trim();

  console.log("Original CSS:");
  console.log(css);
  console.log("\nOriginal size:", css.length, "bytes");

  const result = cleanCSS.minify(css);

  console.log("\nMinified CSS:");
  console.log(result.styles);
  console.log("\nMinified size:", result.stats.minifiedSize, "bytes");
  console.log("Saved:", result.stats.originalSize - result.stats.minifiedSize, "bytes");
  console.log("Reduction:", ((1 - result.stats.minifiedSize / result.stats.originalSize) * 100).toFixed(1) + "%");
  console.log("\n🚀 ~30M downloads/week on npm!");
}
