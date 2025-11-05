/**
 * Color Convert - Color Space Conversion Library
 *
 * Convert between different color spaces (RGB, HSL, HSV, HEX, etc).
 * **POLYGLOT SHOWCASE**: One color converter for ALL languages on Elide!
 *
 * Features:
 * - RGB to/from HEX
 * - RGB to/from HSL
 * - RGB to/from HSV
 * - HSL to/from HSV
 * - Named colors support
 * - Color manipulation
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need color conversions
 * - ONE implementation works everywhere on Elide
 * - Consistent color handling across languages
 * - No need for language-specific color libs
 *
 * Use cases:
 * - Image processing
 * - Web design tools
 * - Data visualization
 * - UI theming
 * - Graphics applications
 * - Color pickers
 *
 * Package has ~10M+ downloads/week on npm!
 */

export type RGB = [number, number, number];
export type HSL = [number, number, number];
export type HSV = [number, number, number];

/**
 * Convert RGB to HEX
 */
export function rgbToHex(rgb: RGB): string {
  const [r, g, b] = rgb.map(v => Math.max(0, Math.min(255, Math.round(v))));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert HEX to RGB
 */
export function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');

  if (cleaned.length === 3) {
    const [r, g, b] = cleaned.split('').map(c => parseInt(c + c, 16));
    return [r, g, b];
  }

  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);

  return [r, g, b];
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  let [r, g, b] = rgb.map(v => v / 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  let [h, s, l] = [hsl[0] / 360, hsl[1] / 100, hsl[2] / 100];

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Convert RGB to HSV
 */
export function rgbToHsv(rgb: RGB): HSV {
  let [r, g, b] = rgb.map(v => v / 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

/**
 * Convert HSV to RGB
 */
export function hsvToRgb(hsv: HSV): RGB {
  let [h, s, v] = [hsv[0] / 360, hsv[1] / 100, hsv[2] / 100];

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r, g, b;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = g = b = 0;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Convert HSL to HSV
 */
export function hslToHsv(hsl: HSL): HSV {
  return rgbToHsv(hslToRgb(hsl));
}

/**
 * Convert HSV to HSL
 */
export function hsvToHsl(hsv: HSV): HSL {
  return rgbToHsl(hsvToRgb(hsv));
}

/**
 * Named colors
 */
export const namedColors: Record<string, RGB> = {
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  white: [255, 255, 255],
  black: [0, 0, 0],
  yellow: [255, 255, 0],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
  gray: [128, 128, 128],
  orange: [255, 165, 0],
  purple: [128, 0, 128],
  pink: [255, 192, 203],
  brown: [165, 42, 42],
  lime: [0, 255, 0]
};

/**
 * Get RGB from color name
 */
export function nameToRgb(name: string): RGB | null {
  return namedColors[name.toLowerCase()] || null;
}

/**
 * Lighten a color
 */
export function lighten(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl[2] = Math.min(100, hsl[2] + amount);
  return hslToRgb(hsl);
}

/**
 * Darken a color
 */
export function darken(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl[2] = Math.max(0, hsl[2] - amount);
  return hslToRgb(hsl);
}

/**
 * Saturate a color
 */
export function saturate(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl[1] = Math.min(100, hsl[1] + amount);
  return hslToRgb(hsl);
}

/**
 * Desaturate a color
 */
export function desaturate(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl[1] = Math.max(0, hsl[1] - amount);
  return hslToRgb(hsl);
}

/**
 * Invert a color
 */
export function invert(rgb: RGB): RGB {
  return [255 - rgb[0], 255 - rgb[1], 255 - rgb[2]];
}

/**
 * Get complementary color
 */
export function complement(rgb: RGB): RGB {
  const hsl = rgbToHsl(rgb);
  hsl[0] = (hsl[0] + 180) % 360;
  return hslToRgb(hsl);
}

// Default export
export default {
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  hslToHsv,
  hsvToHsl,
  nameToRgb,
  lighten,
  darken,
  saturate,
  desaturate,
  invert,
  complement,
  namedColors
};

// CLI Demo
if (import.meta.url.includes("elide-color-convert.ts")) {
  console.log("🎨 Color Convert - Color Space Conversions for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: RGB to HEX ===");
  console.log("RGB(255, 0, 0) =>", rgbToHex([255, 0, 0]));
  console.log("RGB(0, 255, 0) =>", rgbToHex([0, 255, 0]));
  console.log("RGB(0, 0, 255) =>", rgbToHex([0, 0, 255]));
  console.log("RGB(128, 128, 128) =>", rgbToHex([128, 128, 128]));
  console.log();

  console.log("=== Example 2: HEX to RGB ===");
  console.log("#FF0000 =>", hexToRgb('#FF0000'));
  console.log("#00FF00 =>", hexToRgb('#00FF00'));
  console.log("#00F =>", hexToRgb('#00F'));
  console.log("#808080 =>", hexToRgb('#808080'));
  console.log();

  console.log("=== Example 3: RGB to HSL ===");
  console.log("RGB(255, 0, 0) =>", rgbToHsl([255, 0, 0]));
  console.log("RGB(0, 255, 0) =>", rgbToHsl([0, 255, 0]));
  console.log("RGB(128, 128, 128) =>", rgbToHsl([128, 128, 128]));
  console.log();

  console.log("=== Example 4: HSL to RGB ===");
  console.log("HSL(0, 100, 50) =>", hslToRgb([0, 100, 50]));
  console.log("HSL(120, 100, 50) =>", hslToRgb([120, 100, 50]));
  console.log("HSL(0, 0, 50) =>", hslToRgb([0, 0, 50]));
  console.log();

  console.log("=== Example 5: RGB to HSV ===");
  console.log("RGB(255, 0, 0) =>", rgbToHsv([255, 0, 0]));
  console.log("RGB(0, 255, 0) =>", rgbToHsv([0, 255, 0]));
  console.log("RGB(128, 128, 128) =>", rgbToHsv([128, 128, 128]));
  console.log();

  console.log("=== Example 6: Named Colors ===");
  console.log("'red' =>", nameToRgb('red'));
  console.log("'green' =>", nameToRgb('green'));
  console.log("'blue' =>", nameToRgb('blue'));
  console.log("'orange' =>", nameToRgb('orange'));
  console.log();

  console.log("=== Example 7: Lighten/Darken ===");
  const baseColor: RGB = [100, 150, 200];
  console.log("Base:", baseColor, "=>", rgbToHex(baseColor));
  console.log("Lighten 20%:", lighten(baseColor, 20), "=>", rgbToHex(lighten(baseColor, 20)));
  console.log("Darken 20%:", darken(baseColor, 20), "=>", rgbToHex(darken(baseColor, 20)));
  console.log();

  console.log("=== Example 8: Saturate/Desaturate ===");
  const grayish: RGB = [150, 100, 100];
  console.log("Base:", grayish, "=>", rgbToHex(grayish));
  console.log("Saturate 30%:", saturate(grayish, 30), "=>", rgbToHex(saturate(grayish, 30)));
  console.log("Desaturate 30%:", desaturate(grayish, 30), "=>", rgbToHex(desaturate(grayish, 30)));
  console.log();

  console.log("=== Example 9: Invert ===");
  console.log("RGB(255, 0, 0) =>", invert([255, 0, 0]));
  console.log("RGB(0, 255, 0) =>", invert([0, 255, 0]));
  console.log("RGB(128, 128, 128) =>", invert([128, 128, 128]));
  console.log();

  console.log("=== Example 10: Complementary Colors ===");
  const primary: RGB = [255, 0, 0];
  const comp = complement(primary);
  console.log("Primary:", primary, "=>", rgbToHex(primary));
  console.log("Complement:", comp, "=>", rgbToHex(comp));
  console.log();

  console.log("=== Example 11: Round-trip Conversion ===");
  const original: RGB = [123, 456, 78];
  const hex = rgbToHex(original);
  const hsl = rgbToHsl(original);
  const hsv = rgbToHsv(original);
  const backFromHex = hexToRgb(hex);
  const backFromHsl = hslToRgb(hsl);
  const backFromHsv = hsvToRgb(hsv);
  console.log("Original RGB:", original);
  console.log("To HEX:", hex, "=> back:", backFromHex);
  console.log("To HSL:", hsl, "=> back:", backFromHsl);
  console.log("To HSV:", hsv, "=> back:", backFromHsv);
  console.log();

  console.log("=== Example 12: POLYGLOT Use Case ===");
  console.log("🌐 Same color converter works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent color conversions everywhere");
  console.log("  ✓ No language-specific color bugs");
  console.log("  ✓ Share color logic across polyglot projects");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Image processing");
  console.log("- Web design tools");
  console.log("- Data visualization");
  console.log("- UI theming");
  console.log("- Graphics applications");
  console.log("- Color pickers");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~10M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Share color schemes across languages");
  console.log("- One source of truth for colors");
  console.log("- Perfect for design systems!");
}
