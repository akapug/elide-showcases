/**
 * server-timing - Server-Timing Header
 *
 * Express middleware for Server-Timing header (performance metrics).
 * **POLYGLOT SHOWCASE**: Server timing for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/server-timing (~50K+ downloads/week)
 *
 * Features:
 * - Server-Timing header generation
 * - Performance metrics
 * - Multiple timing entries
 * - Custom descriptions
 * - Browser DevTools integration
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Standard timing across languages
 * - ONE timing format on Elide
 * - Browser-compatible metrics
 * - Cross-service performance tracking
 *
 * Use cases:
 * - Performance profiling
 * - Backend timing visibility
 * - DevTools integration
 * - Optimization insights
 *
 * Package has ~50K+ downloads/week on npm!
 */

interface TimingEntry {
  name: string;
  description?: string;
  duration?: number;
}

class ServerTiming {
  private entries: TimingEntry[] = [];

  constructor(res: any) {
    res.serverTiming = this;
  }

  add(name: string, description?: string, duration?: number): void {
    this.entries.push({ name, description, duration });
  }

  from(name: string, description?: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.add(name, description, duration);
    };
  }

  toString(): string {
    return this.entries
      .map((entry) => {
        let metric = entry.name;

        if (entry.description) {
          metric += `;desc="${entry.description}"`;
        }

        if (entry.duration !== undefined) {
          metric += `;dur=${entry.duration.toFixed(2)}`;
        }

        return metric;
      })
      .join(', ');
  }
}

function serverTiming() {
  return (req: any, res: any, next: any) => {
    const timing = new ServerTiming(res);

    const originalEnd = res.end;

    res.end = function (this: any, ...args: any[]) {
      const header = timing.toString();
      if (header) {
        this.setHeader('Server-Timing', header);
        console.log(`[server-timing] ${req.method} ${req.url} - ${header}`);
      }
      return originalEnd.apply(this, args);
    };

    next();
  };
}

export { serverTiming, ServerTiming, TimingEntry };
export default serverTiming;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏲️ server-timing - Server-Timing Header (POLYGLOT!)\n");

  console.log("=== Basic Usage ===");
  const middleware = serverTiming();

  const mockReq = { method: 'GET', url: '/api/users' };
  const mockRes = {
    setHeader: (name: string, value: string) => {
      console.log(`  ${name}: ${value}`);
    },
    end: function (...args: any[]) {
      console.log('Response ended');
    },
  };

  middleware(mockReq, mockRes, () => {
    const timing = mockRes.serverTiming;

    timing.add('db', 'Database query', 45.23);
    timing.add('cache', 'Cache lookup', 2.15);
    timing.add('render', 'Template rendering', 12.87);

    mockRes.end();
  });
  console.log();

  console.log("=== Using from() Helper ===");
  middleware(mockReq, mockRes, () => {
    const timing = mockRes.serverTiming;

    const endDb = timing.from('db', 'User query');
    // Simulate database work
    setTimeout(() => {
      endDb();

      const endRender = timing.from('render', 'HTML generation');
      // Simulate rendering
      setTimeout(() => {
        endRender();

        timing.add('total', 'Total processing', 150);
        mockRes.end();
      }, 30);
    }, 50);
  });
  console.log();

  console.log("=== Multiple Metrics ===");
  middleware(mockReq, mockRes, () => {
    const timing = mockRes.serverTiming;

    timing.add('auth', 'Authentication', 15.2);
    timing.add('validate', 'Input validation', 3.1);
    timing.add('business', 'Business logic', 45.8);
    timing.add('serialize', 'Response serialization', 8.5);

    mockRes.end();
  });
  console.log();

  console.log("=== Performance Tracking ===");
  middleware(mockReq, mockRes, () => {
    const timing = mockRes.serverTiming;

    const operations = [
      { name: 'db-read', desc: 'Read from database', dur: 23.4 },
      { name: 'api-call', desc: 'External API call', dur: 156.7 },
      { name: 'transform', desc: 'Data transformation', dur: 12.3 },
      { name: 'compress', desc: 'Response compression', dur: 8.9 },
    ];

    operations.forEach(op => {
      timing.add(op.name, op.desc, op.dur);
    });

    const total = operations.reduce((sum, op) => sum + op.dur, 0);
    console.log(`  Total processing time: ${total.toFixed(2)}ms`);

    mockRes.end();
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Performance profiling");
  console.log("- Backend timing visibility");
  console.log("- Browser DevTools integration");
  console.log("- Optimization insights");
  console.log("- ~50K+ downloads/week on npm!");
}
