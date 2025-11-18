"""
Embeddings module using sentence-transformers
This runs in-process with TypeScript via Elide's polyglot runtime
"""
from sentence_transformers import SentenceTransformer
from typing import List, Union
import numpy as np

class EmbeddingService:
    """
    High-performance embedding service using sentence-transformers
    Runs in the same process as the TypeScript API - NO network overhead
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding model

        Args:
            model_name: HuggingFace model name (default: all-MiniLM-L6-v2)
                       - all-MiniLM-L6-v2: Fast, 384 dimensions
                       - all-mpnet-base-v2: Better quality, 768 dimensions
                       - multi-qa-mpnet-base-dot-v1: Optimized for Q&A
        """
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()

    def encode(self, texts: Union[str, List[str]],
               batch_size: int = 32,
               normalize: bool = True) -> np.ndarray:
        """
        Generate embeddings for text(s)

        Args:
            texts: Single text or list of texts
            batch_size: Batch size for encoding
            normalize: Whether to L2 normalize embeddings

        Returns:
            numpy array of embeddings (shape: [n_texts, dimension])
        """
        if isinstance(texts, str):
            texts = [texts]

        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=normalize,
            show_progress_bar=False
        )

        return embeddings

    def encode_queries(self, queries: Union[str, List[str]]) -> np.ndarray:
        """
        Encode queries (optimized for search)

        Args:
            queries: Single query or list of queries

        Returns:
            numpy array of query embeddings
        """
        return self.encode(queries, normalize=True)

    def encode_documents(self, documents: List[str],
                        batch_size: int = 32) -> np.ndarray:
        """
        Encode documents (optimized for indexing)

        Args:
            documents: List of documents
            batch_size: Batch size for encoding

        Returns:
            numpy array of document embeddings
        """
        return self.encode(documents, batch_size=batch_size, normalize=True)

    def similarity(self, embedding1: np.ndarray,
                   embedding2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings

        Args:
            embedding1: First embedding
            embedding2: Second embedding

        Returns:
            Cosine similarity score
        """
        return float(np.dot(embedding1, embedding2))

    def get_model_info(self) -> dict:
        """
        Get model information

        Returns:
            Dictionary with model metadata
        """
        return {
            "model_name": self.model_name,
            "dimension": self.dimension,
            "max_seq_length": self.model.max_seq_length,
            "tokenizer": str(type(self.model.tokenizer).__name__)
        }


# Global instance for reuse (avoid reloading model)
_embedding_service = None

def get_embedding_service(model_name: str = "all-MiniLM-L6-v2") -> EmbeddingService:
    """
    Get or create the global embedding service instance

    Args:
        model_name: Model name to use

    Returns:
        EmbeddingService instance
    """
    global _embedding_service

    if _embedding_service is None or _embedding_service.model_name != model_name:
        _embedding_service = EmbeddingService(model_name)

    return _embedding_service


# Convenience functions for direct access from TypeScript
def encode_text(text: str, model_name: str = "all-MiniLM-L6-v2") -> List[float]:
    """
    Encode a single text to embedding

    Args:
        text: Text to encode
        model_name: Model to use

    Returns:
        Embedding as list of floats
    """
    service = get_embedding_service(model_name)
    embedding = service.encode(text)
    return embedding[0].tolist()


def encode_texts(texts: List[str],
                 model_name: str = "all-MiniLM-L6-v2") -> List[List[float]]:
    """
    Encode multiple texts to embeddings

    Args:
        texts: List of texts to encode
        model_name: Model to use

    Returns:
        List of embeddings
    """
    service = get_embedding_service(model_name)
    embeddings = service.encode(texts)
    return embeddings.tolist()


def get_embedding_dimension(model_name: str = "all-MiniLM-L6-v2") -> int:
    """
    Get the embedding dimension for a model

    Args:
        model_name: Model name

    Returns:
        Embedding dimension
    """
    service = get_embedding_service(model_name)
    return service.dimension
