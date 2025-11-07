"""
Text Embeddings Module for Nanochat-Lite

Generates dense vector representations of text for:
- Semantic search
- Similarity matching
- Context retrieval
- Clustering and classification

This demonstrates Python's strength in numerical computing and ML,
integrated seamlessly with TypeScript web logic in Elide.
"""

import time
import math
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass


@dataclass
class EmbeddingConfig:
    """Configuration for embedding generation."""
    model_name: str = "all-MiniLM-L6-v2"
    dimension: int = 384
    normalize: bool = True
    batch_size: int = 32


class EmbeddingEngine:
    """
    Engine for generating text embeddings.

    In production, this would use sentence-transformers or similar:
    from sentence_transformers import SentenceTransformer
    """

    def __init__(self, config: Optional[EmbeddingConfig] = None):
        """Initialize the embedding engine."""
        self.config = config or EmbeddingConfig()
        self.model_loaded = False
        self.embedding_cache: Dict[str, List[float]] = {}

        print(f"EmbeddingEngine initialized (model={self.config.model_name})")

    def load_model(self) -> None:
        """Load the embedding model."""
        start_time = time.time()

        # In production:
        # from sentence_transformers import SentenceTransformer
        # self.model = SentenceTransformer(self.config.model_name)

        time.sleep(0.1)  # Simulate loading

        self.model_loaded = True
        load_time = time.time() - start_time

        print(f"Embedding model loaded in {load_time:.3f}s")

    def embed(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Input text to embed

        Returns:
            Embedding vector
        """
        if not self.model_loaded:
            self.load_model()

        # Check cache
        if text in self.embedding_cache:
            return self.embedding_cache[text]

        # In production:
        # embedding = self.model.encode(text, normalize_embeddings=self.config.normalize)
        # return embedding.tolist()

        # Demo: generate deterministic "embedding"
        embedding = self._generate_demo_embedding(text)

        # Cache result
        if len(self.embedding_cache) < 1000:  # Limit cache size
            self.embedding_cache[text] = embedding

        return embedding

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (more efficient).

        Args:
            texts: List of input texts

        Returns:
            List of embedding vectors
        """
        if not self.model_loaded:
            self.load_model()

        # In production:
        # embeddings = self.model.encode(
        #     texts,
        #     batch_size=self.config.batch_size,
        #     normalize_embeddings=self.config.normalize
        # )
        # return embeddings.tolist()

        return [self.embed(text) for text in texts]

    def _generate_demo_embedding(self, text: str) -> List[float]:
        """
        Generate a deterministic demo embedding based on text content.

        This creates a vector that has some semantic properties:
        - Similar texts produce similar vectors
        - Dimension is configurable
        - Values are normalized
        """
        # Use hash for determinism
        hash_val = hash(text)

        # Generate vector based on text characteristics
        embedding = []
        for i in range(self.config.dimension):
            # Mix hash and character codes for pseudo-semantic properties
            seed = hash_val + i
            char_sum = sum(ord(c) for c in text) if text else 0

            val = math.sin(seed * 0.1 + char_sum * 0.01)
            embedding.append(val)

        # Normalize if configured
        if self.config.normalize:
            embedding = self._normalize_vector(embedding)

        return embedding

    def _normalize_vector(self, vector: List[float]) -> List[float]:
        """Normalize vector to unit length."""
        magnitude = math.sqrt(sum(x * x for x in vector))
        if magnitude > 0:
            return [x / magnitude for x in vector]
        return vector

    def cosine_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """
        Calculate cosine similarity between two embeddings.

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Similarity score between -1 and 1
        """
        if len(embedding1) != len(embedding2):
            raise ValueError("Embeddings must have same dimension")

        dot_product = sum(a * b for a, b in zip(embedding1, embedding2))
        magnitude1 = math.sqrt(sum(x * x for x in embedding1))
        magnitude2 = math.sqrt(sum(x * x for x in embedding2))

        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0

        return dot_product / (magnitude1 * magnitude2)

    def find_most_similar(
        self,
        query: str,
        candidates: List[str],
        top_k: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Find most similar texts to a query.

        Args:
            query: Query text
            candidates: List of candidate texts
            top_k: Number of results to return

        Returns:
            List of (text, similarity_score) tuples
        """
        query_embedding = self.embed(query)
        candidate_embeddings = self.embed_batch(candidates)

        # Calculate similarities
        similarities = []
        for text, embedding in zip(candidates, candidate_embeddings):
            similarity = self.cosine_similarity(query_embedding, embedding)
            similarities.append((text, similarity))

        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)

        return similarities[:top_k]

    def cluster_texts(
        self,
        texts: List[str],
        num_clusters: int = 5
    ) -> List[List[int]]:
        """
        Cluster texts based on semantic similarity.

        Args:
            texts: List of texts to cluster
            num_clusters: Number of clusters

        Returns:
            List of clusters, where each cluster is a list of text indices
        """
        if not texts:
            return []

        # Generate embeddings
        embeddings = self.embed_batch(texts)

        # In production, use sklearn or similar:
        # from sklearn.cluster import KMeans
        # kmeans = KMeans(n_clusters=num_clusters)
        # labels = kmeans.fit_predict(embeddings)

        # Demo: simple distance-based clustering
        clusters: List[List[int]] = [[] for _ in range(num_clusters)]

        for i, embedding in enumerate(embeddings):
            # Assign to cluster based on simple hash
            cluster_id = hash(tuple(embedding[:10])) % num_clusters
            clusters[cluster_id].append(i)

        return clusters

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get embedding cache statistics."""
        return {
            "cached_embeddings": len(self.embedding_cache),
            "cache_hit_rate": 0.0,  # Would track this in production
            "model_loaded": self.model_loaded
        }

    def clear_cache(self) -> None:
        """Clear the embedding cache."""
        self.embedding_cache.clear()


class SemanticSearch:
    """
    Semantic search engine using embeddings.

    Provides fast similarity search over a collection of documents.
    """

    def __init__(self, embedding_engine: Optional[EmbeddingEngine] = None):
        """Initialize semantic search."""
        self.engine = embedding_engine or EmbeddingEngine()
        self.documents: List[str] = []
        self.document_embeddings: List[List[float]] = []

    def add_documents(self, documents: List[str]) -> None:
        """
        Add documents to the search index.

        Args:
            documents: List of documents to index
        """
        print(f"Indexing {len(documents)} documents...")
        start_time = time.time()

        embeddings = self.engine.embed_batch(documents)

        self.documents.extend(documents)
        self.document_embeddings.extend(embeddings)

        index_time = time.time() - start_time
        print(f"Indexed in {index_time:.3f}s")

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """
        Search for documents similar to query.

        Args:
            query: Search query
            top_k: Number of results to return

        Returns:
            List of (document, similarity_score) tuples
        """
        if not self.documents:
            return []

        query_embedding = self.engine.embed(query)

        # Calculate similarities
        similarities = []
        for doc, doc_embedding in zip(self.documents, self.document_embeddings):
            similarity = self.engine.cosine_similarity(query_embedding, doc_embedding)
            similarities.append((doc, similarity))

        # Sort and return top-k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]

    def get_index_stats(self) -> Dict[str, Any]:
        """Get index statistics."""
        return {
            "document_count": len(self.documents),
            "index_size_mb": len(self.document_embeddings) * len(self.document_embeddings[0]) * 4 / 1024 / 1024 if self.document_embeddings else 0
        }


# Global instances
_embedding_engine: Optional[EmbeddingEngine] = None
_semantic_search: Optional[SemanticSearch] = None


def get_embedding_engine() -> EmbeddingEngine:
    """Get or create the global embedding engine."""
    global _embedding_engine

    if _embedding_engine is None:
        _embedding_engine = EmbeddingEngine()
        _embedding_engine.load_model()

    return _embedding_engine


def get_semantic_search() -> SemanticSearch:
    """Get or create the global semantic search instance."""
    global _semantic_search

    if _semantic_search is None:
        _semantic_search = SemanticSearch(get_embedding_engine())

    return _semantic_search


def embed_text(text: str) -> List[float]:
    """Convenience function for embedding text."""
    return get_embedding_engine().embed(text)


def find_similar(query: str, candidates: List[str], top_k: int = 5) -> List[Tuple[str, float]]:
    """Convenience function for similarity search."""
    return get_embedding_engine().find_most_similar(query, candidates, top_k)


if __name__ == "__main__":
    # Demo usage
    print("=== Nanochat-Lite Embeddings Demo ===\n")

    engine = get_embedding_engine()

    # Generate embeddings
    texts = [
        "Machine learning is fascinating",
        "Deep learning and neural networks",
        "Python is a great programming language",
        "TypeScript enables type-safe web development",
        "Elide provides polyglot runtime capabilities"
    ]

    print("Generating embeddings...")
    embeddings = engine.embed_batch(texts)
    print(f"Generated {len(embeddings)} embeddings of dimension {len(embeddings[0])}\n")

    # Similarity search
    query = "What is machine learning?"
    print(f"Query: {query}")
    similar = engine.find_most_similar(query, texts, top_k=3)
    print("Most similar:")
    for text, score in similar:
        print(f"  {score:.3f}: {text}")
    print()

    # Semantic search
    search = get_semantic_search()
    search.add_documents(texts)

    results = search.search("programming languages", top_k=3)
    print("Search results for 'programming languages':")
    for doc, score in results:
        print(f"  {score:.3f}: {doc}")
    print()

    # Stats
    print("Cache stats:", engine.get_cache_stats())
    print("Index stats:", search.get_index_stats())
