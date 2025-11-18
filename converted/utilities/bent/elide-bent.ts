/**
 * Bent - Functional HTTP client
 * Package has ~1M downloads/week on npm!
 */

export function bent(baseUrl?: string, ...defaults: any[]) {
  const config: any = { baseUrl: baseUrl || '', method: 'GET', headers: {} };

  for (const item of defaults) {
    if (typeof item === 'string') {
      if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(item.toUpperCase())) {
        config.method = item.toUpperCase();
      } else if (item === 'json') {
        config.json = true;
      }
    } else if (typeof item === 'object') {
      Object.assign(config.headers, item);
    }
  }

  return async (url: string, body?: any) => {
    const fullUrl = config.baseUrl + url;
    const options: RequestInit = {
      method: config.method,
      headers: config.headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(fullUrl, options);
    return config.json ? response.json() : response.text();
  };
}

export default bent;

if (import.meta.url.includes("elide-bent.ts")) {
  console.log("🌐 Bent - Functional HTTP (POLYGLOT!) | ~1M downloads/week");
}
