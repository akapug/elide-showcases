/**
 * EventSource Parser - SSE Stream Parser
 *
 * Server-Sent Events stream parser.
 * **POLYGLOT SHOWCASE**: SSE parser in ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/eventsource-parser (~100K+ downloads/week)
 *
 * Features:
 * - Parse SSE streams
 * - Event extraction
 * - Data field parsing
 * - ID tracking
 * - Retry parsing
 * - Zero dependencies
 *
 * Use cases:
 * - SSE client implementation
 * - Stream processing
 * - Real-time data parsing
 * - Event extraction
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface ParsedEvent {
  type: 'event';
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

export function createParser(onParse: (event: ParsedEvent) => void) {
  let buffer = '';
  let event: Partial<ParsedEvent> = {};

  return {
    feed(chunk: string): void {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.length === 0) {
          // Empty line = end of event
          if (event.data !== undefined) {
            onParse(event as ParsedEvent);
            event = {};
          }
          continue;
        }

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const field = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1).trimStart();

        switch (field) {
          case 'event':
            event.event = value;
            break;
          case 'data':
            event.data = (event.data || '') + value;
            event.type = 'event';
            break;
          case 'id':
            event.id = value;
            break;
          case 'retry':
            event.retry = parseInt(value, 10);
            break;
        }
      }
    },

    reset(): void {
      buffer = '';
      event = {};
    }
  };
}

export default { createParser };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 EventSource Parser - SSE Stream Parser for Elide (POLYGLOT!)\n");

  const parser = createParser((event) => {
    console.log('[Parser] Parsed event:', event);
  });

  const stream = `event: message
data: Hello, world!
id: 1

event: update
data: {"status": "active"}
id: 2

`;

  parser.feed(stream);

  console.log("\n✅ Use Cases: SSE client implementation, stream processing");
  console.log("~100K+ downloads/week on npm!");
}
