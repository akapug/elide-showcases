/**
 * Simple Get - Simplest way to make HTTP GET requests
 * Package has ~8M downloads/week on npm!
 */

export interface SimpleGetOptions {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  json?: boolean;
}

export function simpleGet(url: string | SimpleGetOptions, callback?: (err: any, res: any) => void): Promise<any> {
  const options = typeof url === 'string' ? { url } : url;
  const { url: targetUrl = '', method = 'GET', headers = {}, json = false } = options;

  const promise = (async () => {
    try {
      const response = await fetch(targetUrl, { method, headers });
      const data = json ? await response.json() : await response.text();
      const result = { statusCode: response.status, body: data };

      if (callback) {
        callback(null, result);
      }
      return result;
    } catch (error) {
      if (callback) {
        callback(error, null);
      }
      throw error;
    }
  })();

  return promise;
}

simpleGet.get = simpleGet;
simpleGet.concat = async (options: string | SimpleGetOptions) => {
  const result = await simpleGet(options);
  return result.body;
};

export default simpleGet;

if (import.meta.url.includes("elide-simple-get.ts")) {
  console.log("🌐 Simple Get - Simple HTTP GET (POLYGLOT!) | ~8M downloads/week");
}
