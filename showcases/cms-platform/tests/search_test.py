"""
CMS Platform - Search Service Tests

Unit tests for the search indexing and recommendation engine.
"""

import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from search.search_indexer import (
    SearchIndexer,
    SearchDocument,
    RecommendationEngine,
    SearchService
)
from datetime import datetime


class TestSearchIndexer(unittest.TestCase):
    """Test cases for SearchIndexer"""

    def setUp(self):
        """Set up test fixtures"""
        self.indexer = SearchIndexer()

    def test_tokenize_basic(self):
        """Test basic text tokenization"""
        text = "Hello World! This is a test."
        tokens = self.indexer.tokenize(text)

        self.assertIn('hello', tokens)
        self.assertIn('world', tokens)
        self.assertIn('test', tokens)

    def test_tokenize_removes_stop_words(self):
        """Test that stop words are removed"""
        text = "The quick brown fox jumps over the lazy dog"
        tokens = self.indexer.tokenize(text)

        self.assertNotIn('the', tokens)
        self.assertIn('quick', tokens)
        self.assertIn('brown', tokens)

    def test_index_document(self):
        """Test document indexing"""
        doc = SearchDocument(
            id='1',
            title='Python Programming',
            content='Learn Python programming language',
            excerpt='Python tutorial',
            author='user1',
            categories=['programming'],
            tags=['python', 'tutorial'],
            status='published'
        )

        self.indexer.index_document(doc)

        self.assertEqual(len(self.indexer.documents), 1)
        self.assertIn('1', self.indexer.documents)
        self.assertIn('python', self.indexer.inverted_index)

    def test_remove_document(self):
        """Test document removal"""
        doc = SearchDocument(
            id='1',
            title='Test Document',
            content='Test content',
            excerpt='Test',
            author='user1',
            categories=[],
            tags=[],
            status='published'
        )

        self.indexer.index_document(doc)
        self.assertEqual(len(self.indexer.documents), 1)

        self.indexer.remove_document('1')
        self.assertEqual(len(self.indexer.documents), 0)

    def test_search_basic(self):
        """Test basic search functionality"""
        docs = [
            SearchDocument(
                id='1',
                title='Python Programming',
                content='Learn Python programming',
                excerpt='Python guide',
                author='user1',
                categories=[],
                tags=['python'],
                status='published'
            ),
            SearchDocument(
                id='2',
                title='JavaScript Guide',
                content='Learn JavaScript programming',
                excerpt='JS guide',
                author='user1',
                categories=[],
                tags=['javascript'],
                status='published'
            )
        ]

        for doc in docs:
            self.indexer.index_document(doc)

        results = self.indexer.search('python programming')

        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0].document.id, '1')

    def test_search_with_filters(self):
        """Test search with status filter"""
        docs = [
            SearchDocument(
                id='1',
                title='Published Article',
                content='Content',
                excerpt='Excerpt',
                author='user1',
                categories=[],
                tags=[],
                status='published'
            ),
            SearchDocument(
                id='2',
                title='Draft Article',
                content='Content',
                excerpt='Excerpt',
                author='user1',
                categories=[],
                tags=[],
                status='draft'
            )
        ]

        for doc in docs:
            self.indexer.index_document(doc)

        results = self.indexer.search(
            'article',
            filters={'status': 'published'}
        )

        self.assertTrue(len(results) > 0)
        self.assertTrue(all(r.document.status == 'published' for r in results))

    def test_tfidf_calculation(self):
        """Test TF-IDF score calculation"""
        doc1 = SearchDocument(
            id='1',
            title='Python Tutorial',
            content='Python is great',
            excerpt='Learn Python',
            author='user1',
            categories=[],
            tags=[],
            status='published'
        )

        doc2 = SearchDocument(
            id='2',
            title='Programming Guide',
            content='Programming is fun',
            excerpt='Guide',
            author='user1',
            categories=[],
            tags=[],
            status='published'
        )

        self.indexer.index_document(doc1)
        self.indexer.index_document(doc2)

        score = self.indexer.calculate_tfidf('python', '1')
        self.assertGreater(score, 0.0)

    def test_suggest_similar(self):
        """Test similar document suggestions"""
        docs = [
            SearchDocument(
                id='1',
                title='Python Programming',
                content='Learn Python programming language basics',
                excerpt='Python guide',
                author='user1',
                categories=[],
                tags=['python', 'programming'],
                status='published'
            ),
            SearchDocument(
                id='2',
                title='Python Advanced',
                content='Advanced Python programming techniques',
                excerpt='Advanced Python',
                author='user1',
                categories=[],
                tags=['python', 'advanced'],
                status='published'
            ),
            SearchDocument(
                id='3',
                title='JavaScript Guide',
                content='Learn JavaScript programming',
                excerpt='JS guide',
                author='user1',
                categories=[],
                tags=['javascript'],
                status='published'
            )
        ]

        for doc in docs:
            self.indexer.index_document(doc)

        similar = self.indexer.suggest_similar('1', limit=2)

        self.assertTrue(len(similar) > 0)
        # Most similar should be doc 2 (also about Python)
        self.assertEqual(similar[0].document.id, '2')

    def test_search_highlights(self):
        """Test search result highlighting"""
        doc = SearchDocument(
            id='1',
            title='Test Article',
            content='This is a test article with some interesting content about testing',
            excerpt='Test',
            author='user1',
            categories=[],
            tags=[],
            status='published'
        )

        self.indexer.index_document(doc)
        results = self.indexer.search('test')

        self.assertTrue(len(results) > 0)
        self.assertTrue(len(results[0].highlights) > 0)

    def test_statistics(self):
        """Test indexer statistics"""
        doc = SearchDocument(
            id='1',
            title='Test',
            content='Content',
            excerpt='Excerpt',
            author='user1',
            categories=[],
            tags=[],
            status='published'
        )

        self.indexer.index_document(doc)
        stats = self.indexer.get_statistics()

        self.assertEqual(stats['total_documents'], 1)
        self.assertGreater(stats['total_terms'], 0)


class TestRecommendationEngine(unittest.TestCase):
    """Test cases for RecommendationEngine"""

    def setUp(self):
        """Set up test fixtures"""
        self.indexer = SearchIndexer()
        self.engine = RecommendationEngine(self.indexer)

    def test_track_view(self):
        """Test view tracking"""
        self.engine.track_view('user1', 'doc1')
        self.engine.track_view('user1', 'doc2')

        self.assertEqual(len(self.engine.view_history['user1']), 2)
        self.assertEqual(self.engine.popularity_scores['doc1'], 1)

    def test_popularity_scores(self):
        """Test popularity tracking"""
        self.engine.track_view('user1', 'doc1')
        self.engine.track_view('user2', 'doc1')
        self.engine.track_view('user3', 'doc2')

        self.assertEqual(self.engine.popularity_scores['doc1'], 2)
        self.assertEqual(self.engine.popularity_scores['doc2'], 1)

    def test_popular_recommendations(self):
        """Test popular content recommendations"""
        # Add documents
        docs = [
            SearchDocument(
                id='1',
                title='Popular Article',
                content='Content',
                excerpt='Excerpt',
                author='user1',
                categories=[],
                tags=[],
                status='published'
            ),
            SearchDocument(
                id='2',
                title='Less Popular',
                content='Content',
                excerpt='Excerpt',
                author='user1',
                categories=[],
                tags=[],
                status='published'
            )
        ]

        for doc in docs:
            self.indexer.index_document(doc)

        # Track views
        self.engine.track_view('user1', '1')
        self.engine.track_view('user2', '1')
        self.engine.track_view('user3', '2')

        # Get recommendations (no user context)
        recommendations = self.engine.get_recommendations(limit=2)

        self.assertTrue(len(recommendations) > 0)
        # Most popular should be first
        self.assertEqual(recommendations[0].document.id, '1')


class TestSearchService(unittest.TestCase):
    """Test cases for SearchService"""

    def setUp(self):
        """Set up test fixtures"""
        self.service = SearchService()

    def test_index_article(self):
        """Test article indexing"""
        article = {
            'id': '1',
            'title': 'Test Article',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'author_id': 'user1',
            'categories': ['cat1'],
            'tags': ['tag1'],
            'status': 'published'
        }

        self.service.index_article(article)

        self.assertEqual(len(self.service.indexer.documents), 1)

    def test_remove_article(self):
        """Test article removal"""
        article = {
            'id': '1',
            'title': 'Test',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'author_id': 'user1',
            'status': 'published'
        }

        self.service.index_article(article)
        self.service.remove_article('1')

        self.assertEqual(len(self.service.indexer.documents), 0)

    def test_search_api(self):
        """Test search API"""
        article = {
            'id': '1',
            'title': 'Python Programming',
            'content': 'Learn Python',
            'excerpt': 'Python guide',
            'author_id': 'user1',
            'status': 'published'
        }

        self.service.index_article(article)
        result = self.service.search('python')

        self.assertEqual(result['query'], 'python')
        self.assertTrue(result['total'] > 0)
        self.assertTrue(len(result['results']) > 0)

    def test_get_similar_api(self):
        """Test similar articles API"""
        articles = [
            {
                'id': '1',
                'title': 'Python Basics',
                'content': 'Python programming basics',
                'excerpt': 'Learn Python',
                'author_id': 'user1',
                'tags': ['python'],
                'status': 'published'
            },
            {
                'id': '2',
                'title': 'Python Advanced',
                'content': 'Advanced Python techniques',
                'excerpt': 'Advanced Python',
                'author_id': 'user1',
                'tags': ['python'],
                'status': 'published'
            }
        ]

        for article in articles:
            self.service.index_article(article)

        result = self.service.get_similar('1')

        self.assertEqual(result['article_id'], '1')
        self.assertTrue(result['total'] > 0)

    def test_track_view_api(self):
        """Test view tracking API"""
        self.service.track_view('user1', 'article1')

        self.assertEqual(
            len(self.service.recommendations.view_history['user1']),
            1
        )

    def test_get_stats(self):
        """Test statistics API"""
        article = {
            'id': '1',
            'title': 'Test',
            'content': 'Content',
            'excerpt': 'Excerpt',
            'author_id': 'user1',
            'status': 'published'
        }

        self.service.index_article(article)
        stats = self.service.get_stats()

        self.assertEqual(stats['total_documents'], 1)
        self.assertGreater(stats['total_terms'], 0)


def run_tests():
    """Run all tests"""
    print("\n=== Running Search Service Tests ===\n")

    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestSearchIndexer))
    suite.addTests(loader.loadTestsFromTestCase(TestRecommendationEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestSearchService))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Print summary
    print("\n" + "=" * 70)
    print(f"Tests run: {result.testsRun}")
    print(f"Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failed: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("=" * 70 + "\n")

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
