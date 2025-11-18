/**
 * response-time - Response Time Middleware
 *
 * Express middleware for recording response times.
 * **POLYGLOT SHOWCASE**: Response timing for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/response-time (~500K+ downloads/week)
 *
 * Features:
 * - Response time measurement
 * - Custom header name
 * - Callback support
 * - High-resolution timing
 * - Millisecond precision
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Measure performance across languages
 * - ONE timing standard on Elide
 * - Consistent metrics collection
 * - Cross-service comparison
 *
 * Use cases:
 * - Performance monitoring
 * - SLA tracking
 * - Response time logging
 * - Performance optimization
 *
 * Package has ~500K+ downloads/week on npm!
 */

interface ResponseTimeOptions {
  digits?: number;
  header?: string;
  suffix?: boolean;
}

type ResponseTimeCallback = (req: any, res: any, time: number) => void;

function responseTime(options?: ResponseTimeOptions): any;
function responseTime(callback: ResponseTimeCallback): any;
function responseTime(optionsOrCallback?: ResponseTimeOptions | ResponseTimeCallback): any {
  const isCallback = typeof optionsOrCallback === 'function';
  const options = isCallback ? {} : (optionsOrCallback || {});
  const callback = isCallback ? optionsOrCallback : undefined;

  const {
    digits = 3,
    header = 'X-Response-Time',
    suffix = true,
  } = options;

  return (req: any, res: any, next: any) => {
    const startTime = process.hrtime ? process.hrtime() : [0, Date.now() * 1e6];

    const onFinish = () => {
      const diff = process.hrtime ? process.hrtime(startTime) : [0, Date.now() * 1e6 - startTime[1]];
      const time = diff[0] * 1e3 + diff[1] * 1e-6;
      const formattedTime = time.toFixed(digits);

      const headerValue = suffix ? `${formattedTime}ms` : formattedTime;
      res.setHeader(header, headerValue);

      if (callback) {
        callback(req, res, time);
      }

      console.log(`[response-time] ${req.method} ${req.url} - ${formattedTime}ms`);
    };

    res.on('finish', onFinish);
    res.on('close', onFinish);

    next();
  };
}

export { responseTime, ResponseTimeOptions, ResponseTimeCallback };
export default responseTime;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏱️ response-time - Response Timing (POLYGLOT!)\n");

  console.log("=== Basic Usage ===");
  const middleware = responseTime();

  const mockReq = { method: 'GET', url: '/api/users' };
  const mockRes = {
    setHeader: (name: string, value: string) => {
      console.log(`  Header: ${name} = ${value}`);
    },
    on: (event: string, handler: any) => {
      if (event === 'finish') {
        setTimeout(handler, 50);
      }
    },
  };

  middleware(mockReq, mockRes, () => {
    console.log('Request processing...');
  });
  console.log();

  console.log("=== Custom Options ===");
  const customMiddleware = responseTime({
    digits: 2,
    header: 'X-Custom-Response-Time',
    suffix: false,
  });

  customMiddleware(mockReq, mockRes, () => {});
  console.log();

  console.log("=== With Callback ===");
  const callbackMiddleware = responseTime((req, res, time) => {
    console.log(`  Callback: ${req.method} ${req.url} took ${time.toFixed(2)}ms`);

    if (time > 100) {
      console.log(`  ⚠️ Slow request detected!`);
    }
  });

  callbackMiddleware(mockReq, mockRes, () => {});
  console.log();

  console.log("=== Performance Tracking ===");
  const times: number[] = [];
  const trackingMiddleware = responseTime((req, res, time) => {
    times.push(time);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`  Response time: ${time.toFixed(2)}ms | Average: ${avg.toFixed(2)}ms`);
  });

  for (let i = 0; i < 3; i++) {
    const req = { method: 'GET', url: `/api/resource/${i}` };
    trackingMiddleware(req, mockRes, () => {});
  }
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Performance monitoring");
  console.log("- SLA tracking");
  console.log("- Response time logging");
  console.log("- Performance optimization");
  console.log("- ~500K+ downloads/week on npm!");
}
