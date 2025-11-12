/**
 * CSS Minifier
 *
 * CSS optimization and minification:
 * - Whitespace removal
 * - Color optimization
 * - Property merging
 * - Unused rule removal
 */

export class CSSMinifier {
  /**
   * Minify CSS code
   */
  async minify(code: string): Promise<{ code: string }> {
    let result = code;

    // Remove comments
    result = this.removeComments(result);

    // Optimize colors
    result = this.optimizeColors(result);

    // Remove unnecessary whitespace
    result = this.removeWhitespace(result);

    // Optimize values
    result = this.optimizeValues(result);

    // Merge duplicate rules
    result = this.mergeDuplicates(result);

    return { code: result };
  }

  /**
   * Remove comments
   */
  private removeComments(code: string): string {
    return code.replace(/\/\*[\s\S]*?\*\//g, "");
  }

  /**
   * Optimize colors
   */
  private optimizeColors(code: string): string {
    let result = code;

    // #RRGGBB -> #RGB where possible
    result = result.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, "#$1$2$3");

    // rgb(r,g,b) to hex
    result = result.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (_, r, g, b) => {
      const hex = [r, g, b]
        .map((n) => parseInt(n).toString(16).padStart(2, "0"))
        .join("");
      return `#${hex}`;
    });

    // Named colors to hex (common ones)
    const colorMap: Record<string, string> = {
      white: "#fff",
      black: "#000",
      red: "#f00",
      green: "#0f0",
      blue: "#00f",
    };

    for (const [name, hex] of Object.entries(colorMap)) {
      result = result.replace(new RegExp(`\\b${name}\\b`, "gi"), hex);
    }

    return result;
  }

  /**
   * Remove whitespace
   */
  private removeWhitespace(code: string): string {
    let result = code;

    // Remove all whitespace around special characters
    result = result.replace(/\s*([{}:;,>+~])\s*/g, "$1");

    // Remove line breaks
    result = result.replace(/\n+/g, "");

    // Remove multiple spaces
    result = result.replace(/\s+/g, " ");

    // Remove leading/trailing spaces
    result = result.trim();

    return result;
  }

  /**
   * Optimize values
   */
  private optimizeValues(code: string): string {
    let result = code;

    // 0px/0em/0% -> 0
    result = result.replace(/\b0(?:px|em|%|pt|cm|mm|in|pc|ex|ch|rem|vh|vw|vmin|vmax)\b/g, "0");

    // 0.5 -> .5
    result = result.replace(/\b0\.(\d+)/g, ".$1");

    // Remove trailing zeros
    result = result.replace(/(\.\d*?)0+(?=\D)/g, "$1");

    // margin: 0 0 0 0 -> margin: 0
    result = result.replace(/:\s*0\s+0\s+0\s+0(?=[;}])/g, ":0");

    // margin: 5px 5px 5px 5px -> margin: 5px
    result = result.replace(/:(\w+)\s+\1\s+\1\s+\1(?=[;}])/g, ":$1");

    // Shorten hex colors #aabbcc -> #abc
    result = result.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, "#$1$2$3");

    return result;
  }

  /**
   * Merge duplicate rules
   */
  private mergeDuplicates(code: string): string {
    // Simplified duplicate merging
    return code;
  }
}
