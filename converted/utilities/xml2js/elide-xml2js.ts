/**
 * XML to JavaScript Object Parser for Elide
 * NPM: 15M+ downloads/week
 */

export function parseString(xml: string, callback: (err: Error | null, result: any) => void): void {
  try {
    const result = parseXML(xml);
    callback(null, result);
  } catch (err) {
    callback(err as Error, null);
  }
}

export function parseStringPromise(xml: string): Promise<any> {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function parseXML(xml: string): any {
  const result: any = {};
  const tagPattern = /<(\w+)([^>]*)>(.*?)<\/\1>/gs;
  const selfClosingPattern = /<(\w+)([^>]*?)\/>/g;

  let match;

  // Parse self-closing tags
  while ((match = selfClosingPattern.exec(xml)) !== null) {
    const [, tagName, attrs] = match;
    result[tagName] = parseAttributes(attrs);
  }

  // Parse regular tags
  xml.replace(tagPattern, (_, tagName, attrs, content) => {
    const parsed: any = {};

    // Parse attributes
    const attributes = parseAttributes(attrs);
    if (Object.keys(attributes).length > 0) {
      parsed.$ = attributes;
    }

    // Parse content
    if (content.includes('<')) {
      parsed._ = parseXML(content);
    } else {
      parsed._ = content.trim();
    }

    result[tagName] = Object.keys(parsed).length === 1 && '_' in parsed ? parsed._ : parsed;
    return '';
  });

  return result;
}

function parseAttributes(attrString: string): any {
  const attrs: any = {};
  const attrPattern = /(\w+)="([^"]*)"/g;
  let match;

  while ((match = attrPattern.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

if (import.meta.url.includes("xml2js")) {
  console.log("🎯 xml2js for Elide - XML to JavaScript Object\n");
  const xml = '<root><name>Alice</name><age>25</age></root>';
  parseString(xml, (err, result) => {
    if (err) console.error(err);
    else console.log("Parsed:", JSON.stringify(result, null, 2));
  });
}

export default { parseString, parseStringPromise };
