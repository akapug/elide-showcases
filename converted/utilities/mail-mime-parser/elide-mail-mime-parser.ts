/**
 * Mail MIME Parser - MIME Email Parser
 *
 * Parse MIME formatted emails.
 * **POLYGLOT SHOWCASE**: One MIME parser for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mail-mime-parser (~20K+ downloads/week)
 */

export interface ParsedMail {
  headers: Record<string, string>;
  subject?: string;
  from?: string;
  to?: string[];
  body?: string;
  html?: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export function parse(mimeString: string): ParsedMail {
  const parts = mimeString.split('\r\n\r\n');
  const headers: Record<string, string> = {};

  // Parse headers
  if (parts[0]) {
    parts[0].split('\r\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    });
  }

  return {
    headers,
    subject: headers['subject'],
    from: headers['from'],
    to: headers['to']?.split(',').map(s => s.trim()),
    body: parts[1] || '',
    attachments: []
  };
}

export default { parse };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📬 Mail MIME Parser - MIME Parser for Elide (POLYGLOT!)\n");

  const mime = `Subject: Test
From: sender@example.com
To: recipient@example.com

This is the body.`;

  const parsed = parse(mime);
  console.log(parsed);

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
