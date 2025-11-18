/**
 * Fetch Retry - Adds retry functionality to fetch
 *
 * Wrapper around fetch with automatic retry logic
 * Package has ~3M downloads/week on npm!
 */

export interface FetchRetryOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  retryOn?: number[];
}

export async function fetchRetry(url: string, options: FetchRetryOptions = {}): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    retryOn = [408, 500, 502, 503, 504, 522, 524],
    ...fetchOptions
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      if (!retryOn.includes(response.status)) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

export default fetchRetry;

if (import.meta.url.includes("elide-fetch-retry.ts")) {
  console.log("🌐 Fetch Retry - Fetch with retries (POLYGLOT!) | ~3M downloads/week");
}
