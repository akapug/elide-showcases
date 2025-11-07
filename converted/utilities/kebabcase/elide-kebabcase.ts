export default function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-').toLowerCase();
}
if (import.meta.url.includes("kebabcase.ts")) {
  console.log("✅", kebabCase("fooBar"), kebabCase("hello_world"));
}
