# Debugging Techniques for Elide Applications

**Comprehensive guide to debugging TypeScript, Python, Ruby, and Java code on Elide**

Learn effective debugging strategies, tools, and techniques for troubleshooting Elide applications.

---

## Table of Contents

- [Debugging Strategies](#debugging-strategies)
- [Console Debugging](#console-debugging)
- [Logging Techniques](#logging-techniques)
- [Error Handling](#error-handling)
- [HTTP Request Debugging](#http-request-debugging)
- [Polyglot Debugging](#polyglot-debugging)
- [Common Issues](#common-issues)
- [Best Practices](#best-practices)

---

## Debugging Strategies

### Debugging Mindset

1. **Reproduce**: Create minimal reproduction case
2. **Isolate**: Narrow down the problematic code
3. **Hypothesis**: Form theories about the cause
4. **Test**: Verify hypotheses with evidence
5. **Fix**: Apply targeted solution
6. **Verify**: Confirm fix works and doesn't break other things

### Debugging Approaches

| Approach | When to Use | Tools |
|----------|-------------|-------|
| **Console Logging** | Quick debugging, simple issues | `console.log()` |
| **Structured Logging** | Production debugging | JSON logs |
| **Error Tracking** | Catch and analyze errors | try/catch |
| **Request Tracing** | HTTP debugging | Request IDs |
| **State Inspection** | Complex state bugs | Logging, dumps |
| **Performance Profiling** | Slow code | Timing, profiling |

---

## Console Debugging

### Basic Console Methods

```typescript
// Standard logging
console.log("Simple message");
console.log("Multiple", "values", 123, { key: "value" });

// Different log levels
console.info("Informational message");
console.warn("Warning message");
console.error("Error message");

// Structured output
const user = { id: 1, name: "Alice", email: "alice@example.com" };
console.log("User:", user);
console.dir(user);  // Detailed object inspection

// Timing
console.time("operation");
// ... some operation
console.timeEnd("operation");  // Prints elapsed time

// Assertions
console.assert(condition, "Assertion failed message");
```

### Debugging Helper Functions

```typescript
// debug.ts
export const DEBUG = process.env.DEBUG === "true";

export function debug(category: string, message: string, data?: any) {
  if (!DEBUG) return;

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${category}] ${message}`);

  if (data) {
    console.dir(data, { depth: null });
  }
}

export function trace(fn: Function) {
  return function (...args: any[]) {
    debug("TRACE", `Calling ${fn.name}`, { args });

    const result = fn(...args);

    debug("TRACE", `${fn.name} returned`, { result });

    return result;
  };
}

// Usage
debug("SERVER", "Starting server", { port: 3000 });

const add = trace((a: number, b: number) => a + b);
const result = add(2, 3);  // Logs input and output
```

### Conditional Breakpoints (Console)

```typescript
function processData(data: any[]) {
  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    // Debug specific conditions
    if (item.id === "problematic-id") {
      console.log("Found problematic item:", item);
      debugger;  // Pause execution if DevTools attached
    }

    // Process item
    const result = transformItem(item);

    // Validate result
    if (!result || result.invalid) {
      console.error("Invalid result for item:", item, result);
    }
  }
}
```

---

## Logging Techniques

### Structured Logging

```typescript
// logger.ts
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

export class Logger {
  private context: Record<string, any> = {};

  constructor(defaultContext?: Record<string, any>) {
    this.context = defaultContext || {};
  }

  private log(level: string, message: string, extra?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...extra }
    };

    console.log(JSON.stringify(entry));
  }

  info(message: string, context?: Record<string, any>) {
    this.log("INFO", message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log("WARN", message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      context: { ...this.context, ...context },
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    };

    console.error(JSON.stringify(entry));
  }

  child(context: Record<string, any>): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

// Usage
const logger = new Logger({ service: "api" });

logger.info("Server started", { port: 3000 });

// Create child logger with additional context
const requestLogger = logger.child({ requestId: "req-123" });
requestLogger.info("Processing request", { path: "/api/users" });
requestLogger.error("Request failed", new Error("Database timeout"));
```

### Request Tracing

```typescript
// request-tracer.ts
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default async function fetch(req: Request): Promise<Response> {
  const requestId = req.headers.get("X-Request-ID") || generateRequestId();
  const logger = new Logger({ requestId });

  logger.info("Request received", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers)
  });

  try {
    const response = await handleRequest(req, logger);

    logger.info("Request completed", {
      status: response.status
    });

    // Add request ID to response
    const headers = new Headers(response.headers);
    headers.set("X-Request-ID", requestId);

    return new Response(response.body, {
      status: response.status,
      headers
    });

  } catch (error) {
    logger.error("Request failed", error);

    return new Response(JSON.stringify({
      error: "Internal Server Error",
      requestId
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId
      }
    });
  }
}
```

### Debug Levels

```typescript
// log-levels.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class LeveledLogger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  debug(message: string, data?: any) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, data || "");
    }
  }

  info(message: string, data?: any) {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, data || "");
    }
  }

  warn(message: string, data?: any) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, data || "");
    }
  }

  error(message: string, error?: Error) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error || "");
    }
  }
}

// Usage
const logLevel = process.env.LOG_LEVEL === "debug" ? LogLevel.DEBUG : LogLevel.INFO;
const logger = new LeveledLogger(logLevel);

logger.debug("Detailed debug info", { state: complexState });  // Only in debug mode
logger.info("Normal operation");  // Always shown
```

---

## Error Handling

### Comprehensive Error Handling

```typescript
// errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

// Error handler
export function handleError(error: unknown, logger: Logger): Response {
  if (error instanceof AppError) {
    logger.warn("Application error", {
      code: error.code,
      message: error.message,
      details: error.details
    });

    return new Response(JSON.stringify({
      error: error.message,
      code: error.code,
      details: error.details
    }), {
      status: error.statusCode,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Unexpected errors
  logger.error("Unexpected error", error instanceof Error ? error : new Error(String(error)));

  return new Response(JSON.stringify({
    error: "Internal Server Error",
    code: "INTERNAL_ERROR"
  }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}

// Usage
try {
  const user = await getUser(userId);

  if (!user) {
    throw new NotFoundError(`User ${userId} not found`);
  }

  if (!user.active) {
    throw new ValidationError("User is not active", { userId, status: user.status });
  }

  return user;

} catch (error) {
  return handleError(error, logger);
}
```

### Error Context

```typescript
// Add context to errors
function wrapError(error: Error, context: Record<string, any>): Error {
  const enrichedError = new Error(error.message);
  enrichedError.name = error.name;
  enrichedError.stack = error.stack;
  (enrichedError as any).context = context;
  return enrichedError;
}

// Usage
try {
  await processData(data);
} catch (error) {
  throw wrapError(
    error instanceof Error ? error : new Error(String(error)),
    { data, step: "processing", timestamp: Date.now() }
  );
}
```

---

## HTTP Request Debugging

### Request/Response Logger

```typescript
// http-logger.ts
export async function logRequest(req: Request): Promise<void> {
  console.log("\n=== HTTP Request ===");
  console.log(`${req.method} ${req.url}`);
  console.log("\nHeaders:");

  for (const [key, value] of req.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.clone().text();
    console.log("\nBody:");
    console.log(body);
  }

  console.log("===================\n");
}

export function logResponse(res: Response): void {
  console.log("\n=== HTTP Response ===");
  console.log(`Status: ${res.status} ${res.statusText}`);
  console.log("\nHeaders:");

  for (const [key, value] of res.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  console.log("====================\n");
}

// Usage
export default async function fetch(req: Request): Promise<Response> {
  if (DEBUG) {
    await logRequest(req);
  }

  const response = await handleRequest(req);

  if (DEBUG) {
    logResponse(response);
  }

  return response;
}
```

### cURL Command Generator

```typescript
// curl-generator.ts
export function generateCurlCommand(req: Request): string {
  const url = req.url;
  const method = req.method;

  let curl = `curl -X ${method} '${url}'`;

  // Add headers
  for (const [key, value] of req.headers.entries()) {
    curl += ` \\\n  -H '${key}: ${value}'`;
  }

  // Add body (if applicable)
  if (method !== "GET" && method !== "HEAD") {
    // Would need to get body here
    curl += ` \\\n  -d '${JSON.stringify({ data: "example" })}'`;
  }

  return curl;
}

// Usage
console.log("Reproduce this request:");
console.log(generateCurlCommand(req));
```

---

## Polyglot Debugging

### Cross-Language Error Tracking

```typescript
// polyglot-debug.ts
import { pythonFunction } from "./module.py";

export function debugPolyglotCall<T>(
  languageName: string,
  functionName: string,
  fn: (...args: any[]) => T,
  ...args: any[]
): T {
  console.log(`[POLYGLOT] Calling ${languageName}.${functionName}`);
  console.log(`[POLYGLOT] Arguments:`, args);

  try {
    const start = performance.now();
    const result = fn(...args);
    const duration = performance.now() - start;

    console.log(`[POLYGLOT] ${functionName} completed in ${duration.toFixed(2)}ms`);
    console.log(`[POLYGLOT] Result:`, result);

    return result;

  } catch (error) {
    console.error(`[POLYGLOT] Error in ${languageName}.${functionName}:`, error);
    throw error;
  }
}

// Usage
const result = debugPolyglotCall(
  "Python",
  "processData",
  pythonFunction,
  { data: [1, 2, 3] }
);
```

### Language-Specific Debugging

**TypeScript:**
```typescript
// Set breakpoint (if debugger attached)
debugger;

// Stack trace
console.trace("Current call stack");

// Object inspection
console.dir(complexObject, { depth: null });
```

**Python:**
```python
# Print debugging
print(f"Debug: value={value}, type={type(value)}")

# Stack trace
import traceback
traceback.print_stack()

# Pretty print
import pprint
pprint.pprint(complex_object)
```

**Java:**
```java
// Print debugging
System.out.println("Debug: value=" + value);

// Stack trace
Thread.dumpStack();

// Exception details
try {
    // ...
} catch (Exception e) {
    e.printStackTrace();
}
```

---

## Common Issues

### Issue 1: Import Not Found

```typescript
// ❌ Wrong
import { something } from "package";  // Elide doesn't use npm packages

// ✅ Correct
import { something } from "./local-file.ts";
```

### Issue 2: Module Evaluation Errors

```typescript
// ❌ Wrong - Code runs on import
const data = expensiveOperation();  // Runs immediately!

export function useData() {
  return data;
}

// ✅ Correct - Lazy evaluation
let data: any = null;

export function useData() {
  if (!data) {
    data = expensiveOperation();  // Runs when needed
  }
  return data;
}
```

### Issue 3: Async Errors

```typescript
// ❌ Wrong - Unhandled promise rejection
async function processData() {
  // If this fails, error is swallowed
  await riskyOperation();
}

processData();  // Fire and forget - bad!

// ✅ Correct - Proper error handling
async function processData() {
  try {
    await riskyOperation();
  } catch (error) {
    console.error("Processing failed:", error);
    throw error;  // Re-throw or handle
  }
}

// Always await or catch
processData().catch(error => {
  console.error("Fatal error:", error);
});
```

### Issue 4: Response Not Cloneable

```typescript
// ❌ Wrong - Response can only be read once
const response = new Response(body);
await response.text();  // Read body
await response.text();  // Error! Body already read

// ✅ Correct - Clone if needed
const response = new Response(body);
const text1 = await response.clone().text();
const text2 = await response.text();
```

---

## Best Practices

### 1. Use Descriptive Logging

```typescript
// ❌ Bad
console.log("here");
console.log(x);

// ✅ Good
console.log("Processing user registration", { email, timestamp: Date.now() });
console.log("Validation failed", { errors, input: data });
```

### 2. Include Context

```typescript
// ❌ Bad
throw new Error("Failed");

// ✅ Good
throw new Error(`Failed to process user ${userId}: ${reason}`);
```

### 3. Log at Appropriate Levels

```typescript
// Development - verbose
logger.debug("Function called", { args });

// Production - important events only
logger.info("User registered", { userId });
logger.error("Database connection failed", error);
```

### 4. Clean Up Debug Code

```typescript
// ✅ Good - Use environment variable
if (process.env.DEBUG) {
  console.log("Debug info");
}

// ❌ Bad - Left in production
// console.log("Debug info");  // Commented out
```

### 5. Use Structured Data

```typescript
// ✅ Good - Structured
logger.info("Request processed", {
  method: req.method,
  path: url.pathname,
  status: response.status,
  duration: duration
});

// ❌ Bad - String concatenation
logger.info(`${req.method} ${url.pathname} -> ${response.status} (${duration}ms)`);
```

---

## Next Steps

- **[Profiling](./profiling.md)** - Profile performance issues
- **[Testing](./testing.md)** - Write tests to catch bugs
- **[Troubleshooting](./troubleshooting.md)** - Common problems and solutions
- **[Deployment](./deployment.md)** - Debug production issues

---

## Summary

**Debugging Strategies:**

- ✅ **Console Logging**: Quick debugging with console.log()
- ✅ **Structured Logging**: Production-ready JSON logs
- ✅ **Error Handling**: Comprehensive error tracking
- ✅ **Request Tracing**: Track HTTP requests end-to-end
- ✅ **Polyglot Debugging**: Debug across languages
- ✅ **Common Issues**: Solutions to frequent problems

**Debugging Checklist:**

1. Reproduce the issue consistently
2. Add logging at key points
3. Check error messages and stack traces
4. Verify assumptions with assertions
5. Isolate the problematic code
6. Form and test hypotheses
7. Apply targeted fix
8. Add tests to prevent regression

**Best Practices:**

- Use descriptive log messages
- Include context in errors
- Log at appropriate levels
- Use structured logging
- Clean up debug code
- Add request IDs for tracing
- Handle errors gracefully

🚀 **Debug efficiently and fix issues faster!**
