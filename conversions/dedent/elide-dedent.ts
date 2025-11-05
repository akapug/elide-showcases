// dedent - Remove indentation from multiline strings
// Original: github.com/dmnd/dedent  
export default function dedent(strings: TemplateStringsArray | string, ...values: any[]): string {
  const raw = typeof strings === "string" ? [strings] : strings.raw;
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    result += raw[i].replace(/\\\n[ \t]*/g, "").replace(/\\`/g, "`");
    if (i < values.length) result += values[i];
  }
  const lines = result.split("\n");
  let mindent: number | null = null;
  for (const l of lines) {
    const m = l.match(/^(\s+)\S+/);
    if (m) {
      const indent = m[1].length;
      if (!mindent) mindent = indent;
      else mindent = Math.min(mindent, indent);
    }
  }
  if (mindent !== null) {
    result = lines.map(l => l[0] === " " || l[0] === "\t" ? l.slice(mindent!) : l).join("\n");
  }
  return result.trim();
}
if (import.meta.url.includes("dedent.ts")) {
  const text = dedent`
    Hello
      World
    Test
  `;
  console.log("✅ Dedented:", text);
}
