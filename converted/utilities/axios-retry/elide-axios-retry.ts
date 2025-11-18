/**
 * Axios Retry - Adds retry functionality to axios
 * Package has ~15M downloads/week on npm!
 */

export interface RetryConfig {
  retries?: number;
  retryDelay?: (retryCount: number) => number;
  retryCondition?: (error: any) => boolean;
}

export function axiosRetry(axiosInstance: any, config: RetryConfig = {}) {
  const { retries = 3, retryDelay = (count) => count * 1000 } = config;

  const originalRequest = axiosInstance.request.bind(axiosInstance);

  axiosInstance.request = async function (requestConfig: any) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await originalRequest(requestConfig);
      } catch (error) {
        lastError = error;

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt + 1)));
        }
      }
    }

    throw lastError;
  };

  return axiosInstance;
}

export default axiosRetry;

if (import.meta.url.includes("elide-axios-retry.ts")) {
  console.log("🌐 Axios Retry - Add retries to axios (POLYGLOT!) | ~15M downloads/week");
}
