/**
 * Fetch Retry - Fetch with Retry Logic
 *
 * Extends fetch with configurable retry and exponential backoff.
 * **POLYGLOT SHOWCASE**: One fetch retry library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/fetch-retry (~200K+ downloads/week)
 *
 * Features:
 * - Fetch with retry
 * - Exponential backoff
 * - Configurable retries
 * - Custom retry logic
 * - Status code handling
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Works across all Elide languages
 * - Consistent HTTP retry patterns
 * - Share fetch config
 * - One implementation everywhere
 *
 * Package has ~200K+ downloads/week on npm!
 */

export interface FetchRetryOptions extends RequestInit {
  retries?: number;
  retryDelay?: number | ((attempt: number) => number);
  retryOn?: number[] | ((attempt: number, error: Error | null, response: Response | null) => boolean);
}

export default function fetchRetry(
  url: string,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    retryOn = [408, 429, 500, 502, 503, 504],
    ...fetchOptions
  } = options;

  let attempt = 0;

  const run = async (): Promise<Response> => {
    attempt++;

    try {
      const response = await fetch(url, fetchOptions);

      const shouldRetry = typeof retryOn === 'function'
        ? retryOn(attempt, null, response)
        : retryOn.includes(response.status);

      if (!response.ok && shouldRetry && attempt < retries) {
        const delay = typeof retryDelay === 'function'
          ? retryDelay(attempt)
          : retryDelay * attempt;

        await new Promise(resolve => setTimeout(resolve, delay));
        return run();
      }

      return response;
    } catch (err: any) {
      if (attempt >= retries) {
        throw err;
      }

      const shouldRetry = typeof retryOn === 'function'
        ? retryOn(attempt, err, null)
        : true;

      if (!shouldRetry) {
        throw err;
      }

      const delay = typeof retryDelay === 'function'
        ? retryDelay(attempt)
        : retryDelay * attempt;

      await new Promise(resolve => setTimeout(resolve, delay));
      return run();
    }
  };

  return run();
}

export { fetchRetry };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Fetch Retry - Fetch with Retry Logic (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Fetch Retry ===");
  console.log("fetchRetry('https://api.example.com/data', {");
  console.log("  retries: 3,");
  console.log("  retryDelay: 1000");
  console.log("});\n");

  console.log("=== Example 2: Custom Retry Logic ===");
  console.log("fetchRetry(url, {");
  console.log("  retries: 5,");
  console.log("  retryDelay: (attempt) => Math.pow(2, attempt) * 1000,");
  console.log("  retryOn: (attempt, error, response) => {");
  console.log("    if (response?.status === 429) return true;");
  console.log("    if (error) return true;");
  console.log("    return false;");
  console.log("  }");
  console.log("});\n");

  console.log("=== Example 3: POLYGLOT Use Case ===");
  console.log("🌐 Same fetch-retry works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
}
