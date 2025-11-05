// pad-left - Left pad string with character
export default function padLeft(str: string, width: number, char: string = ' '): string {
  if (typeof str !== 'string') str = String(str);
  if (str.length >= width) return str;
  return char.repeat(width - str.length) + str;
}
if (import.meta.url.includes("pad-left.ts")) {
  console.log("✅ '" + padLeft("5", 3, '0') + "'");
  console.log("✅ '" + padLeft("test", 10) + "'");
}
