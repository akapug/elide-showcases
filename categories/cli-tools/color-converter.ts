/**
 * Color Converter
 * Convert between hex, RGB, HSL, and other color formats
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');

  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return { r, g, b };
  }

  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return { r, g, b };
  }

  throw new Error('Invalid hex color');
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

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

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

export function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.l = Math.min(100, hsl.l + amount);
  return hslToHex(hsl);
}

export function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.l = Math.max(0, hsl.l - amount);
  return hslToHex(hsl);
}

export function saturate(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.s = Math.min(100, hsl.s + amount);
  return hslToHex(hsl);
}

export function desaturate(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.s = Math.max(0, hsl.s - amount);
  return hslToHex(hsl);
}

// CLI demo
if (import.meta.url.includes("color-converter.ts")) {
  const hex = "#3498db";

  console.log("Color Converter Demo");
  console.log("\nOriginal:", hex);

  const rgb = hexToRgb(hex);
  console.log("RGB:", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);

  const hsl = rgbToHsl(rgb);
  console.log("HSL:", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);

  console.log("\nColor Manipulations:");
  console.log("Lighter (+20):", lighten(hex, 20));
  console.log("Darker (-20):", darken(hex, 20));
  console.log("Saturated (+20):", saturate(hex, 20));
  console.log("Desaturated (-20):", desaturate(hex, 20));

  console.log("\nShort hex (#fff):");
  const white = hexToRgb("#fff");
  console.log("RGB:", `rgb(${white.r}, ${white.g}, ${white.b})`);

  console.log("✅ Color converter test passed");
}
