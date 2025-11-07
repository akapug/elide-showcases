/**
 * CMS Platform - Content Manager Tests
 *
 * Unit tests for the content management system.
 */

import { ContentManager } from '../content/content-manager';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

/**
 * Simple test framework
 */
class TestRunner {
  private results: TestResult[] = [];

  test(name: string, fn: () => void | Promise<void>): void {
    try {
      const result = fn();
      if (result instanceof Promise) {
        result
          .then(() => {
            this.results.push({ name, passed: true });
          })
          .catch((error) => {
            this.results.push({ name, passed: false, error: error.message });
          });
      } else {
        this.results.push({ name, passed: true });
      }
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${expected} but got ${actual}`
      );
    }
  }

  assertTrue(condition: boolean, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Condition is not true');
    }
  }

  assertFalse(condition: boolean, message?: string): void {
    if (condition) {
      throw new Error(message || 'Condition is not false');
    }
  }

  assertThrows(fn: () => void, message?: string): void {
    try {
      fn();
      throw new Error(message || 'Function did not throw');
    } catch (error) {
      // Expected
    }
  }

  report(): void {
    console.log('\n=== Content Manager Test Results ===\n');

    let passed = 0;
    let failed = 0;

    this.results.forEach((result) => {
      const status = result.passed ? '✓' : '✗';
      console.log(`${status} ${result.name}`);

      if (!result.passed && result.error) {
        console.log(`  Error: ${result.error}`);
      }

      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    });

    console.log(`\nTotal: ${this.results.length}, Passed: ${passed}, Failed: ${failed}\n`);
  }
}

// Test suite
const runner = new TestRunner();
const contentManager = new ContentManager();

// Test: Create article
runner.test('Should create a new article', async () => {
  const article = await contentManager.createArticle({
    title: 'Test Article',
    content: 'This is test content',
    excerpt: 'Test excerpt',
    authorId: 'user1',
    categories: [],
    tags: ['test']
  });

  runner.assertTrue(!!article.id, 'Article should have an ID');
  runner.assertEqual(article.title, 'Test Article');
  runner.assertEqual(article.status, 'draft');
  runner.assertEqual(article.version, 1);
});

// Test: Get article by ID
runner.test('Should retrieve article by ID', async () => {
  const created = await contentManager.createArticle({
    title: 'Retrievable Article',
    content: 'Content',
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  const retrieved = contentManager.getArticle(created.id);

  runner.assertTrue(!!retrieved, 'Article should be retrievable');
  runner.assertEqual(retrieved?.id, created.id);
  runner.assertEqual(retrieved?.title, 'Retrievable Article');
});

// Test: Update article
runner.test('Should update article content', async () => {
  const article = await contentManager.createArticle({
    title: 'Original Title',
    content: 'Original content',
    excerpt: 'Original excerpt',
    authorId: 'user1'
  });

  const updated = await contentManager.updateArticle(
    article.id,
    { title: 'Updated Title', content: 'Updated content' },
    'user1'
  );

  runner.assertEqual(updated.title, 'Updated Title');
  runner.assertEqual(updated.content, 'Updated content');
  runner.assertEqual(updated.version, 2);
});

// Test: Delete article
runner.test('Should delete article', async () => {
  const article = await contentManager.createArticle({
    title: 'To Delete',
    content: 'Content',
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  await contentManager.deleteArticle(article.id);

  const deleted = contentManager.getArticle(article.id);
  runner.assertTrue(deleted === null, 'Article should be deleted');
});

// Test: Change article status
runner.test('Should change article status', async () => {
  const article = await contentManager.createArticle({
    title: 'Status Test',
    content: 'Content',
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  runner.assertEqual(article.status, 'draft');

  const reviewed = await contentManager.changeStatus(article.id, 'review', 'user2');
  runner.assertEqual(reviewed.status, 'review');

  const published = await contentManager.changeStatus(article.id, 'published', 'user2');
  runner.assertEqual(published.status, 'published');
  runner.assertTrue(!!published.publishedAt);
});

// Test: Get articles with filters
runner.test('Should filter articles by status', async () => {
  await contentManager.createArticle({
    title: 'Draft Article 1',
    content: 'Content',
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  const published = await contentManager.createArticle({
    title: 'Published Article 1',
    content: 'Content',
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  await contentManager.changeStatus(published.id, 'published', 'user1');

  const result = contentManager.getArticles({ status: 'published' });

  runner.assertTrue(result.articles.length > 0);
  runner.assertTrue(
    result.articles.every(a => a.status === 'published'),
    'All articles should be published'
  );
});

// Test: Search articles
runner.test('Should search articles by title', () => {
  const result = contentManager.getArticles({
    search: 'Test Article'
  });

  runner.assertTrue(result.articles.length > 0);
});

// Test: Create category
runner.test('Should create a category', () => {
  const category = contentManager.createCategory({
    name: 'Test Category',
    description: 'Test description'
  });

  runner.assertTrue(!!category.id);
  runner.assertEqual(category.name, 'Test Category');
  runner.assertEqual(category.slug, 'test-category');
});

// Test: Get all categories
runner.test('Should retrieve all categories', () => {
  const categories = contentManager.getCategories();
  runner.assertTrue(categories.length > 0);
});

// Test: Article versioning
runner.test('Should save article versions', async () => {
  const article = await contentManager.createArticle({
    title: 'Versioned Article',
    content: 'Version 1',
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  await contentManager.updateArticle(article.id, { content: 'Version 2' }, 'user1');
  await contentManager.updateArticle(article.id, { content: 'Version 3' }, 'user1');

  const versions = contentManager.getArticleVersions(article.id);
  runner.assertTrue(versions.length >= 3, 'Should have at least 3 versions');
});

// Test: Increment views
runner.test('Should increment article views', async () => {
  const article = await contentManager.createArticle({
    title: 'Popular Article',
    content: 'Content',
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  runner.assertEqual(article.views, 0);

  contentManager.incrementViews(article.id);
  contentManager.incrementViews(article.id);

  const updated = contentManager.getArticle(article.id);
  runner.assertEqual(updated?.views, 2);
});

// Test: Get popular tags
runner.test('Should get popular tags', async () => {
  await contentManager.createArticle({
    title: 'Tagged Article 1',
    content: 'Content',
    excerpt: 'Excerpt',
    authorId: 'user1',
    tags: ['javascript', 'typescript']
  });

  await contentManager.createArticle({
    title: 'Tagged Article 2',
    content: 'Content',
    excerpt: 'Excerpt',
    authorId: 'user1',
    tags: ['javascript', 'react']
  });

  // Publish articles
  const articles = contentManager.getArticles().articles;
  for (const article of articles) {
    if (article.tags.length > 0) {
      await contentManager.changeStatus(article.id, 'published', 'user1');
    }
  }

  const tags = contentManager.getPopularTags(10);
  runner.assertTrue(tags.length > 0);

  const jsTag = tags.find(t => t.tag === 'javascript');
  runner.assertTrue(!!jsTag, 'Should include javascript tag');
});

// Test: Article slug generation
runner.test('Should generate URL-friendly slugs', async () => {
  const article = await contentManager.createArticle({
    title: 'Hello World! This is a Test.',
    content: 'Content',
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  runner.assertEqual(article.slug, 'hello-world-this-is-a-test');
});

// Test: Word count calculation
runner.test('Should calculate word count', async () => {
  const article = await contentManager.createArticle({
    title: 'Word Count Test',
    content: 'This is a test article with exactly ten words here.',
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  runner.assertTrue(article.metadata.wordCount > 0);
});

// Test: Reading time calculation
runner.test('Should calculate reading time', async () => {
  const longContent = 'word '.repeat(400); // 400 words

  const article = await contentManager.createArticle({
    title: 'Long Article',
    content: longContent,
    excerpt: 'Excerpt',
    authorId: 'user1'
  });

  runner.assertTrue(article.metadata.readingTime >= 2); // Should be ~2 minutes at 200 WPM
});

// Run all tests
setTimeout(() => {
  runner.report();
}, 100);

export { runner as contentManagerTests };
