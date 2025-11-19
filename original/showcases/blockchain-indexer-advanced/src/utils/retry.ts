export interface RetryOptions {
  retries: number;
  backoff: (attempt: number) => number;
  onRetry?: (error: Error, attempt: number) => void;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < options.retries) {
        const delay = options.backoff(attempt);
        if (options.onRetry) {
          options.onRetry(lastError, attempt);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

export function exponentialBackoff(attempt: number, baseDelay: number = 100): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000);
}

export function linearBackoff(attempt: number, delay: number = 1000): number {
  return delay * (attempt + 1);
}
