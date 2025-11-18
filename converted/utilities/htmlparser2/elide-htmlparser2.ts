/**
 * htmlparser2 - Fast HTML Parser for Elide
 * NPM: 60M+ downloads/week
 */

export interface Handler {
  onopentag?: (name: string, attribs: Record<string, string>) => void;
  ontext?: (text: string) => void;
  onclosetag?: (name: string) => void;
}

export class Parser {
  constructor(private handler: Handler) {}

  write(html: string): void {
    this.parseHTML(html);
  }

  end(): void {
    // Finalize parsing
  }

  private parseHTML(html: string): void {
    const tagPattern = /<(\/?)([\w-]+)([^>]*)>/g;
    let lastIndex = 0;
    let match;

    while ((match = tagPattern.exec(html)) !== null) {
      const [fullMatch, slash, tagName, attrs] = match;

      // Text before tag
      if (match.index > lastIndex) {
        const text = html.slice(lastIndex, match.index);
        if (text.trim() && this.handler.ontext) {
          this.handler.ontext(text.trim());
        }
      }

      if (slash === '/') {
        // Closing tag
        if (this.handler.onclosetag) {
          this.handler.onclosetag(tagName);
        }
      } else {
        // Opening tag
        const attributes = this.parseAttributes(attrs);
        if (this.handler.onopentag) {
          this.handler.onopentag(tagName, attributes);
        }
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Remaining text
    if (lastIndex < html.length) {
      const text = html.slice(lastIndex);
      if (text.trim() && this.handler.ontext) {
        this.handler.ontext(text.trim());
      }
    }
  }

  private parseAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrPattern = /([\w-]+)="([^"]*)"/g;
    let match;

    while ((match = attrPattern.exec(attrString)) !== null) {
      attrs[match[1]] = match[2];
    }

    return attrs;
  }
}

if (import.meta.url.includes("htmlparser2")) {
  console.log("🎯 htmlparser2 for Elide - Fast HTML Parser\n");
  const html = '<div id="main"><h1>Hello</h1><p>World</p></div>';
  const parser = new Parser({
    onopentag: (name, attribs) => console.log("Open:", name, attribs),
    ontext: (text) => console.log("Text:", text),
    onclosetag: (name) => console.log("Close:", name)
  });
  parser.write(html);
  parser.end();
}

export default Parser;
