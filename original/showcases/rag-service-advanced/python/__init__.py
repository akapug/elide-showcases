"""
RAG Service - Python Integration Layer

This package provides the Python components for the RAG service:
- Embedding generation using sentence-transformers
- Vector storage using ChromaDB and FAISS

These components are called directly from TypeScript via Elide's polyglot runtime,
eliminating network latency and serialization overhead.
"""

from .embeddings import (
    EmbeddingService,
    get_embedding_service,
    encode_text,
    encode_texts,
    get_embedding_dimension,
)

from .vectorstore import (
    VectorStore,
    get_vector_store,
)

__all__ = [
    'EmbeddingService',
    'get_embedding_service',
    'encode_text',
    'encode_texts',
    'get_embedding_dimension',
    'VectorStore',
    'get_vector_store',
]

__version__ = '1.0.0'
