"""
Vector store implementation using ChromaDB and FAISS
Runs in-process with TypeScript via Elide's polyglot runtime
"""
import chromadb
from chromadb.config import Settings
import faiss
import numpy as np
from typing import List, Dict, Optional, Tuple
import json
import os

class VectorStore:
    """
    Hybrid vector store using ChromaDB for metadata and FAISS for fast similarity search
    Runs in the same process as TypeScript API - NO network latency
    """

    def __init__(self,
                 collection_name: str = "documents",
                 persist_directory: str = "./data/vectorstore",
                 dimension: int = 384,
                 use_faiss: bool = True):
        """
        Initialize vector store

        Args:
            collection_name: Name of the collection
            persist_directory: Directory to persist data
            dimension: Embedding dimension
            use_faiss: Whether to use FAISS for search (faster)
        """
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.dimension = dimension
        self.use_faiss = use_faiss

        # Initialize ChromaDB
        os.makedirs(persist_directory, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Get or create collection
        try:
            self.collection = self.client.get_collection(name=collection_name)
        except:
            self.collection = self.client.create_collection(
                name=collection_name,
                metadata={"dimension": dimension}
            )

        # Initialize FAISS index if enabled
        self.faiss_index = None
        self.id_map = []  # Map FAISS index to document IDs

        if use_faiss:
            self._init_faiss_index()

    def _init_faiss_index(self):
        """Initialize FAISS index for fast similarity search"""
        # Use IndexFlatIP for inner product (cosine similarity with normalized vectors)
        self.faiss_index = faiss.IndexFlatIP(self.dimension)

        # Load existing embeddings if any
        self._rebuild_faiss_index()

    def _rebuild_faiss_index(self):
        """Rebuild FAISS index from ChromaDB"""
        if self.faiss_index is None:
            return

        # Get all embeddings from ChromaDB
        results = self.collection.get(include=["embeddings", "documents", "metadatas"])

        if results["embeddings"]:
            embeddings = np.array(results["embeddings"], dtype=np.float32)
            self.faiss_index.add(embeddings)
            self.id_map = results["ids"]

    def add_documents(self,
                     documents: List[str],
                     embeddings: List[List[float]],
                     metadatas: Optional[List[Dict]] = None,
                     ids: Optional[List[str]] = None) -> List[str]:
        """
        Add documents to the vector store

        Args:
            documents: List of document texts
            embeddings: List of embeddings
            metadatas: Optional metadata for each document
            ids: Optional IDs for documents (auto-generated if not provided)

        Returns:
            List of document IDs
        """
        if ids is None:
            # Generate IDs
            current_count = self.collection.count()
            ids = [f"doc_{current_count + i}" for i in range(len(documents))]

        if metadatas is None:
            metadatas = [{} for _ in documents]

        # Add to ChromaDB
        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        # Add to FAISS index
        if self.use_faiss and self.faiss_index is not None:
            embeddings_array = np.array(embeddings, dtype=np.float32)
            self.faiss_index.add(embeddings_array)
            self.id_map.extend(ids)

        return ids

    def search(self,
               query_embedding: List[float],
               k: int = 5,
               filter_metadata: Optional[Dict] = None) -> List[Dict]:
        """
        Search for similar documents

        Args:
            query_embedding: Query embedding
            k: Number of results to return
            filter_metadata: Optional metadata filter

        Returns:
            List of results with documents, scores, and metadata
        """
        if self.use_faiss and self.faiss_index is not None and filter_metadata is None:
            return self._search_faiss(query_embedding, k)
        else:
            return self._search_chromadb(query_embedding, k, filter_metadata)

    def _search_faiss(self, query_embedding: List[float], k: int) -> List[Dict]:
        """Search using FAISS (faster)"""
        query_array = np.array([query_embedding], dtype=np.float32)

        # Search FAISS index
        scores, indices = self.faiss_index.search(query_array, k)

        # Get document IDs
        doc_ids = [self.id_map[idx] for idx in indices[0] if idx < len(self.id_map)]

        # Get documents from ChromaDB
        results = self.collection.get(
            ids=doc_ids,
            include=["documents", "metadatas"]
        )

        # Combine results
        output = []
        for i, doc_id in enumerate(doc_ids):
            idx = results["ids"].index(doc_id)
            output.append({
                "id": doc_id,
                "document": results["documents"][idx],
                "metadata": results["metadatas"][idx],
                "score": float(scores[0][i])
            })

        return output

    def _search_chromadb(self,
                        query_embedding: List[float],
                        k: int,
                        filter_metadata: Optional[Dict]) -> List[Dict]:
        """Search using ChromaDB (with metadata filtering)"""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            where=filter_metadata,
            include=["documents", "metadatas", "distances"]
        )

        output = []
        for i in range(len(results["ids"][0])):
            # Convert distance to similarity score
            distance = results["distances"][0][i]
            score = 1.0 - distance  # Assuming L2 distance

            output.append({
                "id": results["ids"][0][i],
                "document": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": score
            })

        return output

    def delete_documents(self, ids: List[str]):
        """
        Delete documents by IDs

        Args:
            ids: List of document IDs to delete
        """
        self.collection.delete(ids=ids)

        # Rebuild FAISS index
        if self.use_faiss and self.faiss_index is not None:
            self.faiss_index.reset()
            self.id_map = []
            self._rebuild_faiss_index()

    def get_document(self, doc_id: str) -> Optional[Dict]:
        """
        Get a document by ID

        Args:
            doc_id: Document ID

        Returns:
            Document data or None if not found
        """
        results = self.collection.get(
            ids=[doc_id],
            include=["documents", "metadatas", "embeddings"]
        )

        if results["ids"]:
            return {
                "id": results["ids"][0],
                "document": results["documents"][0],
                "metadata": results["metadatas"][0],
                "embedding": results["embeddings"][0]
            }

        return None

    def count(self) -> int:
        """Get total number of documents"""
        return self.collection.count()

    def reset(self):
        """Reset the vector store (delete all documents)"""
        self.client.delete_collection(name=self.collection_name)
        self.collection = self.client.create_collection(
            name=self.collection_name,
            metadata={"dimension": self.dimension}
        )

        if self.use_faiss and self.faiss_index is not None:
            self.faiss_index.reset()
            self.id_map = []


# Global instance
_vector_store = None

def get_vector_store(collection_name: str = "documents",
                    persist_directory: str = "./data/vectorstore",
                    dimension: int = 384,
                    use_faiss: bool = True) -> VectorStore:
    """
    Get or create the global vector store instance

    Args:
        collection_name: Collection name
        persist_directory: Persist directory
        dimension: Embedding dimension
        use_faiss: Whether to use FAISS

    Returns:
        VectorStore instance
    """
    global _vector_store

    if _vector_store is None:
        _vector_store = VectorStore(
            collection_name=collection_name,
            persist_directory=persist_directory,
            dimension=dimension,
            use_faiss=use_faiss
        )

    return _vector_store
