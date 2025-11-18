/**
 * Linkify-It - Links recognition library
 *
 * Fast and flexible link detection library
 * Package has ~50M downloads/week on npm!
 */

export interface Match {
  schema: string;
  index: number;
  lastIndex: number;
  raw: string;
  text: string;
  url: string;
}

export class LinkifyIt {
  private schemas: Record<string, boolean> = {
    'http:': true,
    'https:': true,
    'mailto:': true,
  };

  test(text: string): boolean {
    return this.match(text).length > 0;
  }

  match(text: string): Match[] {
    const matches: Match[] = [];
    const urlPattern = /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))/g;

    let match;
    while ((match = urlPattern.exec(text)) !== null) {
      const url = match[1];
      matches.push({
        schema: url.startsWith('https') ? 'https:' : 'http:',
        index: match.index,
        lastIndex: match.index + url.length,
        raw: url,
        text: url,
        url: url,
      });
    }

    return matches;
  }

  set(options: any): this {
    return this;
  }
}

export default function linkifyIt() {
  return new LinkifyIt();
}

if (import.meta.url.includes("elide-linkify-it.ts")) {
  console.log("🌐 Linkify-It (POLYGLOT!)\n");
  console.log("Example:");
  const linkify = new LinkifyIt();
  const text = "Visit https://example.com for info";
  const matches = linkify.match(text);
  console.log("Text:", text);
  console.log("Matches:", matches);
  console.log("\n📦 ~50M downloads/week on npm");
}
