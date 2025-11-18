import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

const MAX_TEXT_LENGTH = parseInt(process.env.MAX_TEXT_LENGTH || '10000', 10);
const MAX_BATCH_SIZE = parseInt(process.env.MAX_BATCH_SIZE || '32', 10);

/**
 * Logger configuration
 */
export const loggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true,
          },
        }
      : undefined,
};

/**
 * Global error handler
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  const statusCode = error.statusCode || 500;

  reply.status(statusCode).send({
    success: false,
    error: error.message || 'Internal server error',
    statusCode,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Validate text input
 */
export function validateTextInput(text: string) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text input is required and must be a string');
  }

  if (text.length === 0) {
    throw new Error('Text cannot be empty');
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text length exceeds maximum of ${MAX_TEXT_LENGTH} characters`);
  }
}

/**
 * Validate batch input
 */
export function validateBatchInput(texts: string[]) {
  if (!Array.isArray(texts)) {
    throw new Error('Texts must be an array');
  }

  if (texts.length === 0) {
    throw new Error('Texts array cannot be empty');
  }

  if (texts.length > MAX_BATCH_SIZE) {
    throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE}`);
  }

  texts.forEach((text, index) => {
    try {
      validateTextInput(text);
    } catch (err) {
      throw new Error(`Invalid text at index ${index}: ${err instanceof Error ? err.message : err}`);
    }
  });
}
