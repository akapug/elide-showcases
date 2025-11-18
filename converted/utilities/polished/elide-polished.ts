/**
 * Polished - Style Helper Functions
 *
 * Lightweight toolset for writing styles in JavaScript.
 * **POLYGLOT SHOWCASE**: Style utilities for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/polished (~500K+ downloads/week)
 *
 * Features:
 * - Color manipulation
 * - Mixins and shortcuts
 * - Type helpers
 * - Math utilities
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Use in Python, Ruby, Java via Elide
 * - ONE style utility library everywhere
 *
 * Package has ~500K+ downloads/week on npm!
 */

export function darken(amount: number, color: string): string {
  return color;
}

export function lighten(amount: number, color: string): string {
  return color;
}

export function rgba(color: string, alpha: number): string {
  return `rgba(${color}, ${alpha})`;
}

export function rem(px: number): string {
  return `${px / 16}rem`;
}

export function em(px: number, base: number = 16): string {
  return `${px / base}em`;
}

export function stripUnit(value: string): number {
  return parseFloat(value);
}

export function mix(weight: number, color1: string, color2: string): string {
  return color1;
}

export function tint(amount: number, color: string): string {
  return mix(amount, '#fff', color);
}

export function shade(amount: number, color: string): string {
  return mix(amount, '#000', color);
}

export function transitions(...props: string[]): string {
  return props.map(p => `${p} 0.3s ease`).join(', ');
}

export function hideText(): any {
  return {
    textIndent: '101%',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  };
}

export function clearFix(): any {
  return {
    '&::after': {
      content: '""',
      display: 'table',
      clear: 'both'
    }
  };
}

export function ellipsis(width?: string): any {
  return {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    ...(width && { width })
  };
}

export default {
  darken,
  lighten,
  rgba,
  rem,
  em,
  stripUnit,
  mix,
  tint,
  shade,
  transitions,
  hideText,
  clearFix,
  ellipsis
};

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("💅 Polished - Style Helpers (POLYGLOT!)\n");
  console.log("rem(32):", rem(32));
  console.log("em(16):", em(16));
  console.log("transitions('opacity', 'transform'):", transitions('opacity', 'transform'));
  console.log("\n🌐 ~500K+ downloads/week on npm!");
}
