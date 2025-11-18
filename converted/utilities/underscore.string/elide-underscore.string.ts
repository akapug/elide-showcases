/**
 * Underscore.string - String Utilities
 *
 * String manipulation extensions for Underscore.
 * **POLYGLOT SHOWCASE**: One string lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/underscore.string (~200K+ downloads/week)
 */

export const _s = {
  capitalize: (str: string): string => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
  
  camelize: (str: string): string => str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : ''),
  
  dasherize: (str: string): string => str.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()).replace(/^-/, ''),
  
  underscored: (str: string): string => str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()).replace(/^_/, ''),
  
  truncate: (str: string, length: number, suffix: string = '...'): string => {
    if (str.length <= length) return str;
    return str.slice(0, length) + suffix;
  },
  
  slugify: (str: string): string => {
    return str.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
  
  startsWith: (str: string, prefix: string): boolean => str.startsWith(prefix),
  
  endsWith: (str: string, suffix: string): boolean => str.endsWith(suffix),
  
  contains: (str: string, substring: string): boolean => str.includes(substring),
  
  trim: (str: string, chars?: string): string => {
    if (!chars) return str.trim();
    const pattern = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g');
    return str.replace(pattern, '');
  },
  
  repeat: (str: string, count: number): string => str.repeat(count),
  
  reverse: (str: string): string => str.split('').reverse().join(''),
};

export default _s;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔤 Underscore.string for Elide (POLYGLOT!)\n");

  console.log("capitalize:", _s.capitalize("hello world"));
  console.log("camelize:", _s.camelize("hello-world-foo"));
  console.log("dasherize:", _s.dasherize("helloWorldFoo"));
  console.log("underscored:", _s.underscored("HelloWorldFoo"));
  console.log("slugify:", _s.slugify("Hello World! 123"));
  console.log("truncate:", _s.truncate("Hello World", 8));
  console.log("repeat:", _s.repeat("ab", 3));
  console.log("reverse:", _s.reverse("hello"));
  
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~200K+ downloads/week on npm");
}
