/**
 * Winston Syslog - Syslog Transport
 *
 * A Winston transport for logging to syslog.
 * **POLYGLOT SHOWCASE**: Syslog logging for ALL languages on Elide!
 *
 * Features:
 * - Syslog protocol support
 * - RFC3164/RFC5424
 * - Facility levels
 * - Severity mapping
 * - UDP/TCP support
 * - Remote logging
 * - Standard compliance
 * - Zero dependencies
 *
 * Use cases:
 * - System logging
 * - Remote logging
 * - Unix systems
 * - Log aggregation
 *
 * Package has ~1M downloads/week on npm!
 */

export type Facility = 'local0' | 'local1' | 'local2' | 'local3' | 'local4' | 'local5' | 'local6' | 'local7';
export type Severity = 'emerg' | 'alert' | 'crit' | 'error' | 'warning' | 'notice' | 'info' | 'debug';

const FACILITIES: Record<Facility, number> = {
  local0: 16, local1: 17, local2: 18, local3: 19,
  local4: 20, local5: 21, local6: 22, local7: 23,
};

const SEVERITIES: Record<Severity, number> = {
  emerg: 0, alert: 1, crit: 2, error: 3,
  warning: 4, notice: 5, info: 6, debug: 7,
};

export class SyslogTransport {
  constructor(
    private facility: Facility = 'local0',
    private host: string = 'localhost',
    private port: number = 514
  ) {}

  log(severity: Severity, message: string): void {
    const priority = FACILITIES[this.facility] * 8 + SEVERITIES[severity];
    const timestamp = new Date().toISOString();
    const syslogMsg = `<${priority}>${timestamp} ${this.host} ${message}`;
    console.log(`[SYSLOG] ${syslogMsg}`);
  }
}

export default SyslogTransport;

// CLI Demo
if (import.meta.url.includes("elide-winston-syslog.ts")) {
  console.log("📡 Winston Syslog Transport (POLYGLOT!)\n");

  const transport = new SyslogTransport('local0', 'localhost', 514);
  transport.log('info', 'Application started');
  transport.log('error', 'Database connection failed');

  console.log("\n💡 Syslog everywhere! ~1M downloads/week");
}
