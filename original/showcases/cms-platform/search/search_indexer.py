"""
CMS Platform - Search Indexing Service

Python-based search indexing and full-text search service.
Provides article indexing, search, and content recommendations.
"""

import re
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Set
from collections import defaultdict
import math


class SearchDocument:
    """Represents a searchable document"""

    def __init__(
        self,
        id: str,
        title: str,
        content: str,
        excerpt: str,
        author: str,
        categories: List[str],
        tags: List[str],
        status: str,
        published_at: Optional[datetime] = None
    ):
        self.id = id
        self.title = title
        self.content = content
        self.excerpt = excerpt
        self.author = author
        self.categories = categories
        self.tags = tags
        self.status = status
        self.published_at = published_at
        self.indexed_at = datetime.now()


class SearchResult:
    """Represents a search result with relevance score"""

    def __init__(self, document: SearchDocument, score: float):
        self.document = document
        self.score = score
        self.highlights: List[str] = []

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.document.id,
            'title': self.document.title,
            'excerpt': self.document.excerpt,
            'author': self.document.author,
            'categories': self.document.categories,
            'tags': self.document.tags,
            'score': self.score,
            'highlights': self.highlights
        }


class SearchIndexer:
    """Full-text search indexer using TF-IDF"""

    def __init__(self):
        self.documents: Dict[str, SearchDocument] = {}
        self.inverted_index: Dict[str, Set[str]] = defaultdict(set)
        self.term_frequencies: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.document_frequencies: Dict[str, int] = defaultdict(int)
        self.stop_words = self._load_stop_words()

    def _load_stop_words(self) -> Set[str]:
        """Load common stop words"""
        return {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
            'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how'
        }

    def tokenize(self, text: str) -> List[str]:
        """Tokenize text into words"""
        # Convert to lowercase
        text = text.lower()

        # Remove special characters and split
        words = re.findall(r'\b[a-z0-9]+\b', text)

        # Remove stop words
        words = [w for w in words if w not in self.stop_words and len(w) > 2]

        return words

    def index_document(self, document: SearchDocument) -> None:
        """Index a document for searching"""
        # Remove existing document if present
        if document.id in self.documents:
            self.remove_document(document.id)

        # Store document
        self.documents[document.id] = document

        # Tokenize content
        title_tokens = self.tokenize(document.title)
        content_tokens = self.tokenize(document.content)
        excerpt_tokens = self.tokenize(document.excerpt)

        # Combine tokens with weights
        # Title words are more important (weight 3x)
        # Excerpt words are moderately important (weight 2x)
        # Content words have normal weight (1x)
        all_tokens = (
            title_tokens * 3 +
            excerpt_tokens * 2 +
            content_tokens +
            document.tags
        )

        # Build inverted index and term frequencies
        for token in all_tokens:
            self.inverted_index[token].add(document.id)
            self.term_frequencies[document.id][token] += 1

        # Update document frequencies
        unique_tokens = set(all_tokens)
        for token in unique_tokens:
            self.document_frequencies[token] += 1

    def remove_document(self, doc_id: str) -> None:
        """Remove a document from the index"""
        if doc_id not in self.documents:
            return

        # Get document tokens
        document = self.documents[doc_id]
        tokens = self.tokenize(
            document.title + ' ' +
            document.content + ' ' +
            document.excerpt
        )

        # Remove from inverted index
        for token in set(tokens):
            self.inverted_index[token].discard(doc_id)
            if not self.inverted_index[token]:
                del self.inverted_index[token]

        # Remove term frequencies
        if doc_id in self.term_frequencies:
            del self.term_frequencies[doc_id]

        # Update document frequencies
        for token in set(tokens):
            self.document_frequencies[token] -= 1
            if self.document_frequencies[token] <= 0:
                del self.document_frequencies[token]

        # Remove document
        del self.documents[doc_id]

    def calculate_tfidf(self, term: str, doc_id: str) -> float:
        """Calculate TF-IDF score for a term in a document"""
        # Term frequency
        tf = self.term_frequencies[doc_id].get(term, 0)

        if tf == 0:
            return 0.0

        # Inverse document frequency
        df = self.document_frequencies.get(term, 0)
        if df == 0:
            return 0.0

        idf = math.log((len(self.documents) + 1) / (df + 1))

        return tf * idf

    def search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[SearchResult]:
        """Search for documents matching the query"""
        # Tokenize query
        query_tokens = self.tokenize(query)

        if not query_tokens:
            return []

        # Find candidate documents
        candidate_docs: Set[str] = set()
        for token in query_tokens:
            if token in self.inverted_index:
                candidate_docs.update(self.inverted_index[token])

        # Apply filters
        if filters:
            candidate_docs = self._apply_filters(candidate_docs, filters)

        # Calculate relevance scores
        results: List[SearchResult] = []

        for doc_id in candidate_docs:
            score = 0.0

            for token in query_tokens:
                score += self.calculate_tfidf(token, doc_id)

            if score > 0:
                document = self.documents[doc_id]
                result = SearchResult(document, score)
                result.highlights = self._generate_highlights(document, query_tokens)
                results.append(result)

        # Sort by score
        results.sort(key=lambda r: r.score, reverse=True)

        return results[:limit]

    def _apply_filters(
        self,
        doc_ids: Set[str],
        filters: Dict[str, Any]
    ) -> Set[str]:
        """Apply filters to candidate documents"""
        filtered = set()

        for doc_id in doc_ids:
            document = self.documents[doc_id]

            # Status filter
            if 'status' in filters and document.status != filters['status']:
                continue

            # Author filter
            if 'author' in filters and document.author != filters['author']:
                continue

            # Category filter
            if 'category' in filters:
                if filters['category'] not in document.categories:
                    continue

            # Tag filter
            if 'tag' in filters:
                if filters['tag'] not in document.tags:
                    continue

            filtered.add(doc_id)

        return filtered

    def _generate_highlights(
        self,
        document: SearchDocument,
        query_tokens: List[str]
    ) -> List[str]:
        """Generate text highlights for search results"""
        highlights = []
        content = document.content.lower()

        for token in query_tokens:
            # Find token occurrences
            pattern = r'\b' + re.escape(token) + r'\b'
            matches = list(re.finditer(pattern, content))

            if matches:
                # Get first match with context
                match = matches[0]
                start = max(0, match.start() - 50)
                end = min(len(content), match.end() + 50)

                highlight = document.content[start:end]
                highlights.append('...' + highlight.strip() + '...')

                if len(highlights) >= 3:
                    break

        return highlights

    def suggest_similar(
        self,
        doc_id: str,
        limit: int = 5
    ) -> List[SearchResult]:
        """Suggest similar documents based on content"""
        if doc_id not in self.documents:
            return []

        source_doc = self.documents[doc_id]

        # Get document tokens
        tokens = self.tokenize(
            source_doc.title + ' ' +
            source_doc.content + ' ' +
            ' '.join(source_doc.tags)
        )

        # Calculate similarity scores
        scores: Dict[str, float] = defaultdict(float)

        for token in set(tokens):
            if token in self.inverted_index:
                for candidate_id in self.inverted_index[token]:
                    if candidate_id != doc_id:
                        scores[candidate_id] += self.calculate_tfidf(token, candidate_id)

        # Create results
        results = []
        for candidate_id, score in scores.items():
            document = self.documents[candidate_id]
            if document.status == 'published':
                results.append(SearchResult(document, score))

        # Sort by score
        results.sort(key=lambda r: r.score, reverse=True)

        return results[:limit]

    def get_statistics(self) -> Dict[str, Any]:
        """Get indexer statistics"""
        return {
            'total_documents': len(self.documents),
            'total_terms': len(self.inverted_index),
            'average_terms_per_document': (
                sum(len(tf) for tf in self.term_frequencies.values()) /
                len(self.documents) if self.documents else 0
            )
        }


class RecommendationEngine:
    """Content recommendation engine"""

    def __init__(self, indexer: SearchIndexer):
        self.indexer = indexer
        self.view_history: Dict[str, List[str]] = defaultdict(list)
        self.popularity_scores: Dict[str, int] = defaultdict(int)

    def track_view(self, user_id: str, doc_id: str) -> None:
        """Track document view for recommendations"""
        self.view_history[user_id].append(doc_id)
        self.popularity_scores[doc_id] += 1

        # Keep last 50 views per user
        if len(self.view_history[user_id]) > 50:
            self.view_history[user_id].pop(0)

    def get_recommendations(
        self,
        user_id: Optional[str] = None,
        limit: int = 5
    ) -> List[SearchResult]:
        """Get personalized recommendations"""
        if user_id and user_id in self.view_history:
            return self._get_personalized_recommendations(user_id, limit)
        else:
            return self._get_popular_recommendations(limit)

    def _get_personalized_recommendations(
        self,
        user_id: str,
        limit: int
    ) -> List[SearchResult]:
        """Get recommendations based on user history"""
        viewed = self.view_history[user_id]

        if not viewed:
            return self._get_popular_recommendations(limit)

        # Get similar documents for recent views
        all_similar: List[SearchResult] = []

        for doc_id in viewed[-5:]:  # Last 5 viewed
            similar = self.indexer.suggest_similar(doc_id, limit * 2)
            all_similar.extend(similar)

        # Remove duplicates and already viewed
        seen = set()
        filtered = []

        for result in all_similar:
            if result.document.id not in seen and result.document.id not in viewed:
                seen.add(result.document.id)
                filtered.append(result)

        # Sort by score
        filtered.sort(key=lambda r: r.score, reverse=True)

        return filtered[:limit]

    def _get_popular_recommendations(self, limit: int) -> List[SearchResult]:
        """Get popular content recommendations"""
        # Get documents sorted by popularity
        popular = sorted(
            self.popularity_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        results = []
        for doc_id, score in popular[:limit]:
            if doc_id in self.indexer.documents:
                document = self.indexer.documents[doc_id]
                if document.status == 'published':
                    results.append(SearchResult(document, float(score)))

        return results

    def get_trending(self, days: int = 7, limit: int = 10) -> List[SearchResult]:
        """Get trending content based on recent popularity"""
        # In a real implementation, this would consider time windows
        # For showcase, return top popular items
        return self._get_popular_recommendations(limit)


class SearchService:
    """Main search service interface"""

    def __init__(self):
        self.indexer = SearchIndexer()
        self.recommendations = RecommendationEngine(self.indexer)

    def index_article(self, article: Dict[str, Any]) -> None:
        """Index an article"""
        document = SearchDocument(
            id=article['id'],
            title=article['title'],
            content=article['content'],
            excerpt=article['excerpt'],
            author=article['author_id'],
            categories=article.get('categories', []),
            tags=article.get('tags', []),
            status=article['status'],
            published_at=article.get('published_at')
        )

        self.indexer.index_document(document)

    def remove_article(self, article_id: str) -> None:
        """Remove article from index"""
        self.indexer.remove_document(article_id)

    def search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Search articles"""
        results = self.indexer.search(query, filters, limit)

        return {
            'query': query,
            'total': len(results),
            'results': [r.to_dict() for r in results]
        }

    def get_similar(self, article_id: str, limit: int = 5) -> Dict[str, Any]:
        """Get similar articles"""
        results = self.indexer.suggest_similar(article_id, limit)

        return {
            'article_id': article_id,
            'total': len(results),
            'results': [r.to_dict() for r in results]
        }

    def get_recommendations(
        self,
        user_id: Optional[str] = None,
        limit: int = 5
    ) -> Dict[str, Any]:
        """Get content recommendations"""
        results = self.recommendations.get_recommendations(user_id, limit)

        return {
            'user_id': user_id,
            'total': len(results),
            'results': [r.to_dict() for r in results]
        }

    def track_view(self, user_id: str, article_id: str) -> None:
        """Track article view"""
        self.recommendations.track_view(user_id, article_id)

    def get_trending(self, days: int = 7, limit: int = 10) -> Dict[str, Any]:
        """Get trending articles"""
        results = self.recommendations.get_trending(days, limit)

        return {
            'days': days,
            'total': len(results),
            'results': [r.to_dict() for r in results]
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get search service statistics"""
        return self.indexer.get_statistics()


# Example usage
if __name__ == '__main__':
    # Create search service
    search_service = SearchService()

    # Index sample articles
    sample_articles = [
        {
            'id': '1',
            'title': 'Getting Started with Python',
            'content': 'Python is a versatile programming language...',
            'excerpt': 'Learn the basics of Python programming',
            'author_id': 'user1',
            'categories': ['programming', 'python'],
            'tags': ['python', 'tutorial', 'beginner'],
            'status': 'published'
        },
        {
            'id': '2',
            'title': 'Advanced TypeScript Patterns',
            'content': 'TypeScript provides powerful type system...',
            'excerpt': 'Explore advanced TypeScript techniques',
            'author_id': 'user2',
            'categories': ['programming', 'typescript'],
            'tags': ['typescript', 'advanced', 'patterns'],
            'status': 'published'
        }
    ]

    for article in sample_articles:
        search_service.index_article(article)

    # Perform search
    results = search_service.search('python programming', limit=10)
    print(f"Search results: {json.dumps(results, indent=2)}")

    # Get statistics
    stats = search_service.get_stats()
    print(f"\nSearch statistics: {json.dumps(stats, indent=2)}")
