/**
 * Response Helpers
 * Utility functions for creating responses
 */

/**
 * Create JSON response
 */
export function json(data: any, status: number = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Create text response
 */
export function text(content: string, status: number = 200, headers: HeadersInit = {}): Response {
  return new Response(content, {
    status,
    headers: {
      'Content-Type': 'text/plain',
      ...headers,
    },
  });
}

/**
 * Create HTML response
 */
export function html(content: string, status: number = 200, headers: HeadersInit = {}): Response {
  return new Response(content, {
    status,
    headers: {
      'Content-Type': 'text/html',
      ...headers,
    },
  });
}

/**
 * Create redirect response
 */
export function redirect(url: string, status: number = 302): Response {
  return new Response(null, {
    status,
    headers: {
      Location: url,
    },
  });
}

/**
 * Create stream response
 */
export function stream(stream: ReadableStream, contentType: string = 'application/octet-stream'): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': contentType,
      'Transfer-Encoding': 'chunked',
    },
  });
}

/**
 * Create SSE (Server-Sent Events) response
 */
export function sse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Create file download response
 */
export function download(file: Blob | File, filename?: string): Response {
  const headers: HeadersInit = {};

  if (filename) {
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;
  }

  if (file instanceof File) {
    headers['Content-Type'] = file.type || 'application/octet-stream';
  }

  return new Response(file, { headers });
}

/**
 * Create no content response
 */
export function noContent(): Response {
  return new Response(null, { status: 204 });
}

/**
 * Create error response
 */
export function error(message: string, status: number = 500): Response {
  return json(
    {
      error: true,
      message,
      status,
    },
    status
  );
}

/**
 * Create not found response
 */
export function notFound(message: string = 'Not found'): Response {
  return error(message, 404);
}

/**
 * Create bad request response
 */
export function badRequest(message: string = 'Bad request'): Response {
  return error(message, 400);
}

/**
 * Create unauthorized response
 */
export function unauthorized(message: string = 'Unauthorized'): Response {
  return error(message, 401);
}

/**
 * Create forbidden response
 */
export function forbidden(message: string = 'Forbidden'): Response {
  return error(message, 403);
}

/**
 * Create conflict response
 */
export function conflict(message: string = 'Conflict'): Response {
  return error(message, 409);
}

/**
 * Create server error response
 */
export function serverError(message: string = 'Internal server error'): Response {
  return error(message, 500);
}

/**
 * Create streaming text generator
 */
export function* streamText(texts: string[]): Generator<string> {
  for (const text of texts) {
    yield text;
  }
}

/**
 * Create SSE event
 */
export function sseEvent(data: any, event?: string, id?: string, retry?: number): string {
  let message = '';

  if (event) {
    message += `event: ${event}\n`;
  }

  if (id) {
    message += `id: ${id}\n`;
  }

  if (retry) {
    message += `retry: ${retry}\n`;
  }

  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  message += `data: ${dataStr}\n\n`;

  return message;
}

/**
 * Create JSON stream
 */
export function jsonStream(data: AsyncIterable<any> | Iterable<any>): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const item of data) {
          const json = JSON.stringify(item) + '\n';
          controller.enqueue(encoder.encode(json));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Create NDJSON (Newline Delimited JSON) response
 */
export function ndjson(data: AsyncIterable<any> | Iterable<any>): Response {
  return new Response(jsonStream(data), {
    headers: {
      'Content-Type': 'application/x-ndjson',
    },
  });
}
