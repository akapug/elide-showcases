/**
 * Cheerio - jQuery for Server-side HTML for Elide
 * NPM: 30M+ downloads/week
 */

class CheerioElement {
  constructor(private html: string, private selector: string) {}

  text(): string {
    const match = this.html.match(/>([^<]+)</);
    return match ? match[1].trim() : '';
  }

  attr(name: string): string | undefined {
    const pattern = new RegExp(`${name}="([^"]*)"`, 'i');
    const match = this.html.match(pattern);
    return match ? match[1] : undefined;
  }

  html(): string {
    return this.html;
  }

  find(selector: string): CheerioElement {
    const tagMatch = selector.match(/^(\w+)/);
    if (tagMatch) {
      const tag = tagMatch[1];
      const pattern = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'g');
      const matches = this.html.match(pattern);
      return new CheerioElement(matches?.[0] || '', selector);
    }
    return new CheerioElement('', selector);
  }
}

export function load(html: string) {
  return function $(selector: string): CheerioElement {
    // Simple tag selector
    const tagMatch = selector.match(/^(\w+)/);
    if (tagMatch) {
      const tag = tagMatch[1];
      const pattern = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'g');
      const matches = html.match(pattern);
      return new CheerioElement(matches?.[0] || '', selector);
    }

    // ID selector
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      const pattern = new RegExp(`<[^>]+id="${id}"[^>]*>.*?</[^>]+>`, 'g');
      const matches = html.match(pattern);
      return new CheerioElement(matches?.[0] || '', selector);
    }

    // Class selector
    if (selector.startsWith('.')) {
      const className = selector.slice(1);
      const pattern = new RegExp(`<[^>]+class="[^"]*${className}[^"]*"[^>]*>.*?</[^>]+>`, 'g');
      const matches = html.match(pattern);
      return new CheerioElement(matches?.[0] || '', selector);
    }

    return new CheerioElement('', selector);
  };
}

if (import.meta.url.includes("cheerio")) {
  console.log("🎯 Cheerio for Elide - Server-side jQuery\n");
  const html = '<div id="main"><h1>Hello</h1><p class="text">World</p></div>';
  const $ = load(html);
  console.log("h1 text:", $('h1').text());
  console.log("div id:", $('div').attr('id'));
}

export default load;
