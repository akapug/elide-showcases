/**
 * Custom error classes for better error handling
 */

export class RAGServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'RAGServiceError';
  }
}

export class ValidationError extends RAGServiceError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends RAGServiceError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class EmbeddingError extends RAGServiceError {
  constructor(message: string) {
    super(message, 500, 'EMBEDDING_ERROR');
    this.name = 'EmbeddingError';
  }
}

export class VectorStoreError extends RAGServiceError {
  constructor(message: string) {
    super(message, 500, 'VECTOR_STORE_ERROR');
    this.name = 'VectorStoreError';
  }
}

export function handleError(error: unknown): RAGServiceError {
  if (error instanceof RAGServiceError) {
    return error;
  }

  if (error instanceof Error) {
    return new RAGServiceError(error.message);
  }

  return new RAGServiceError('Unknown error occurred');
}
