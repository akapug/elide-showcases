/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing headers
 */

export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

export function createCorsHeaders(options: CorsOptions = {}): Record<string, string> {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = true,
  } = options;

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
  };

  if (Array.isArray(origin)) {
    headers['Access-Control-Allow-Origin'] = origin[0];
  } else {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  if (credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

export function handleCorsPreFlight(options: CorsOptions = {}): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(options),
  });
}

export function applyCors(response: Response, options: CorsOptions = {}): Response {
  const corsHeaders = createCorsHeaders(options);
  const newHeaders = new Headers(response.headers);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
