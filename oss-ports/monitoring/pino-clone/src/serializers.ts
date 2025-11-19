/**
 * Pino Standard Serializers
 */

import type { SerializerFn } from './types';

/**
 * Request serializer
 */
function req(request: any): any {
  return {
    id: request.id,
    method: request.method,
    url: request.url,
    query: request.query,
    params: request.params,
    headers: request.headers,
    remoteAddress: request.socket?.remoteAddress,
    remotePort: request.socket?.remotePort,
  };
}

/**
 * Response serializer
 */
function res(response: any): any {
  return {
    statusCode: response.statusCode,
    headers: response.getHeaders ? response.getHeaders() : response.headers,
  };
}

/**
 * Error serializer
 */
function err(error: Error): any {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    type: error.name,
    message: error.message,
    stack: error.stack,
    ...error,
  };
}

/**
 * Wrap error serializer to include custom properties
 */
function wrapErrorSerializer(customSerializer?: SerializerFn): SerializerFn {
  return (error: Error) => {
    const serialized = err(error);

    if (customSerializer) {
      return { ...serialized, ...customSerializer(error) };
    }

    return serialized;
  };
}

/**
 * Map serializer - converts Map to object
 */
function mapHttpRequest(request: any): any {
  return {
    req: req(request),
  };
}

/**
 * Map HTTP response
 */
function mapHttpResponse(response: any): any {
  return {
    res: res(response),
  };
}

export const stdSerializers = {
  req,
  res,
  err,
  wrapErrorSerializer,
  mapHttpRequest,
  mapHttpResponse,
};
