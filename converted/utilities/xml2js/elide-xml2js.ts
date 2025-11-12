/**
 * Elide XML2JS - Universal XML Parser
 */

export interface ParserOptions {
  explicitArray?: boolean;
  ignoreAttrs?: boolean;
  mergeAttrs?: boolean;
}

export class Parser {
  constructor(private options: ParserOptions = {}) {}

  async parseString(xml: string): Promise<any> {
    return this.parseStringPromise(xml);
  }

  async parseStringPromise(xml: string): Promise<any> {
    // Simple XML parsing
    const result: any = {};
    const tagRegex = /<(\w+)([^>]*)>(.*?)<\/\1>/gs;

    let match;
    while ((match = tagRegex.exec(xml)) !== null) {
      const [, tagName, attrs, content] = match;

      if (!result[tagName]) {
        result[tagName] = [];
      }

      const obj: any = {};

      // Parse attributes
      if (!this.options.ignoreAttrs) {
        const attrRegex = /(\w+)="([^"]*)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrs)) !== null) {
          const [, name, value] = attrMatch;
          if (this.options.mergeAttrs) {
            obj[name] = value;
          } else {
            if (!obj.$) obj.$ = {};
            obj.$[name] = value;
          }
        }
      }

      // Parse content
      if (content.includes('<')) {
        obj._ = content;
      } else {
        if (Object.keys(obj).length === 0) {
          result[tagName].push(content);
        } else {
          obj._ = content;
          result[tagName].push(obj);
        }
      }
    }

    return result;
  }
}

export class Builder {
  constructor(private options: any = {}) {}

  buildObject(obj: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += this.objectToXml(obj);
    return xml;
  }

  private objectToXml(obj: any, indent: string = ''): string {
    let xml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          xml += `${indent}<${key}>`;
          if (typeof item === 'object') {
            xml += '\n' + this.objectToXml(item, indent + '  ') + indent;
          } else {
            xml += item;
          }
          xml += `</${key}>\n`;
        }
      } else if (typeof value === 'object') {
        xml += `${indent}<${key}>\n`;
        xml += this.objectToXml(value, indent + '  ');
        xml += `${indent}</${key}>\n`;
      } else {
        xml += `${indent}<${key}>${value}</${key}>\n`;
      }
    }

    return xml;
  }
}

export function parseString(xml: string, callback: (err: Error | null, result: any) => void) {
  const parser = new Parser();
  parser.parseStringPromise(xml)
    .then(result => callback(null, result))
    .catch(err => callback(err, null));
}

export default { Parser, Builder, parseString };

if (import.meta.main) {
  console.log('=== Elide XML2JS Demo ===\n');

  const xml = `
    <root>
      <user id="1">
        <name>John Doe</name>
        <email>john@example.com</email>
      </user>
      <user id="2">
        <name>Jane Smith</name>
        <email>jane@example.com</email>
      </user>
    </root>
  `;

  const parser = new Parser();
  const result = await parser.parseStringPromise(xml);
  console.log('Parsed:', JSON.stringify(result, null, 2));
  console.log('');

  const builder = new Builder();
  const newXml = builder.buildObject({
    person: [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ]
  });
  console.log('Built XML:');
  console.log(newXml);

  console.log('✓ Demo completed');
}
