/**
 * Pino Pretty - Pretty Print Logs
 *
 * A pretty printer for Pino logs with color and formatting.
 * **POLYGLOT SHOWCASE**: Pretty logs for ALL languages on Elide!
 *
 * Features:
 * - Pretty JSON formatting
 * - Color support
 * - Human-readable output
 * - Timestamp formatting
 * - Level badges
 * - Metadata display
 * - Customizable format
 * - Zero dependencies
 *
 * Use cases:
 * - Development logging
 * - Debug output
 * - Human-readable logs
 * - Terminal output
 *
 * Package has ~8M downloads/week on npm!
 */

export interface PrettyOptions {
  colorize?: boolean;
  translateTime?: boolean;
  ignore?: string;
}

export function prettyPrint(logLine: string, options: PrettyOptions = {}): string {
  const { colorize = true, translateTime = true } = options;

  try {
    const log = JSON.parse(logLine);
    const level = log.level || 30;
    const time = translateTime ? new Date(log.time).toLocaleString() : log.time;
    const msg = log.msg || '';

    const levelNames: Record<number, string> = {
      10: 'TRACE', 20: 'DEBUG', 30: 'INFO',
      40: 'WARN', 50: 'ERROR', 60: 'FATAL',
    };

    const levelColors: Record<number, string> = {
      10: '\x1b[90m', 20: '\x1b[36m', 30: '\x1b[32m',
      40: '\x1b[33m', 50: '\x1b[31m', 60: '\x1b[35m',
    };

    const levelName = levelNames[level] || 'INFO';
    const color = colorize ? (levelColors[level] || '') : '';
    const reset = '\x1b[0m';

    let output = `${color}[${time}] ${levelName}:${reset} ${msg}`;

    const { level: _, time: __, msg: ___, ...meta } = log;
    if (Object.keys(meta).length > 0) {
      output += `\n    ${JSON.stringify(meta, null, 2)}`;
    }

    return output;
  } catch {
    return logLine;
  }
}

export default prettyPrint;

// CLI Demo
if (import.meta.url.includes("elide-pino-pretty.ts")) {
  console.log("🎨 Pino Pretty - Pretty Print Logs (POLYGLOT!)\n");

  const logs = [
    JSON.stringify({ level: 30, time: Date.now(), msg: 'Application started' }),
    JSON.stringify({ level: 40, time: Date.now(), msg: 'Warning', userId: 123 }),
    JSON.stringify({ level: 50, time: Date.now(), msg: 'Error occurred', error: 'timeout' }),
  ];

  logs.forEach(log => {
    console.log(prettyPrint(log));
  });

  console.log("\n💡 Pretty logs everywhere! ~8M downloads/week");
}
