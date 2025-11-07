/**
 * ElideHTML - Infinite Scroll Example
 *
 * Efficient pagination with htmx intersection observer.
 * Demonstrates loading more content as user scrolls.
 */

import { html, render } from '../../runtime/renderer.ts';
import { Layout, UI } from '../../runtime/components.ts';
import { htmx } from '../../helpers/htmx-helpers.ts';

export interface Post {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: Date;
  image: string;
  readTime: number;
}

/**
 * Generate sample posts
 */
export function generatePosts(start: number, count: number): Post[] {
  const posts: Post[] = [];

  for (let i = start; i < start + count; i++) {
    posts.push({
      id: i,
      title: `Post Title ${i}`,
      excerpt: `This is the excerpt for post ${i}. It provides a brief overview of what the post is about and entices readers to click through.`,
      author: ['Alice Smith', 'Bob Johnson', 'Carol Williams', 'David Brown'][
        i % 4
      ],
      date: new Date(2024, 0, 1 + i),
      image: `https://picsum.photos/seed/${i}/400/250`,
      readTime: 3 + (i % 5),
    });
  }

  return posts;
}

/**
 * Render a single post card
 */
export function PostCard(post: Post): string {
  return render(
    html.article(
      { class: 'post-card' },
      html.div(
        { class: 'post-image' },
        html.img({ src: post.image, alt: post.title, loading: 'lazy' })
      ),
      html.div(
        { class: 'post-content' },
        html.h2({ class: 'post-title' }, post.title),
        html.div(
          { class: 'post-meta' },
          html.span({ class: 'post-author' }, post.author),
          html.span({ class: 'post-date' }, post.date.toLocaleDateString()),
          html.span({ class: 'post-read-time' }, `${post.readTime} min read`)
        ),
        html.p({ class: 'post-excerpt' }, post.excerpt),
        html.a({ href: `#post-${post.id}`, class: 'read-more' }, 'Read more →')
      )
    )
  );
}

/**
 * Render posts list
 */
export function PostsList(posts: Post[]): string {
  return render(
    html.div(
      { class: 'posts-list' },
      ...posts.map((post) => PostCard(post) as any)
    )
  );
}

/**
 * Render load more trigger
 */
export function LoadMoreTrigger(page: number, hasMore: boolean): string {
  if (!hasMore) {
    return render(
      html.div(
        { id: 'load-more', class: 'load-more' },
        html.div({ class: 'end-message' }, "That's all folks! 🎉")
      )
    );
  }

  return render(
    html.div(
      {
        id: 'load-more',
        class: 'load-more',
        ...htmx.infiniteScroll(`/posts?page=${page}`, 0.8),
      },
      html.div({ class: 'loading' }, UI.Spinner({ size: 'md' }) as any, 'Loading more...')
    )
  );
}

/**
 * Render infinite scroll page
 */
export function InfiniteScrollPage(initialPosts: Post[]): string {
  return render(
    Layout.Document({
      title: 'ElideHTML Infinite Scroll',
      htmx: true,
      head: [
        html.style(
          null,
          `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              background: #f8fafc;
            }
            .header {
              background: white;
              border-bottom: 1px solid #e2e8f0;
              padding: 2rem 0;
              margin-bottom: 2rem;
            }
            .header-content {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 1rem;
            }
            .header h1 {
              font-size: 2rem;
              color: #1a202c;
              margin-bottom: 0.5rem;
            }
            .header p {
              color: #718096;
              font-size: 1.125rem;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 1rem 2rem;
            }
            .posts-list {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
              gap: 2rem;
              margin-bottom: 2rem;
            }
            .post-card {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .post-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .post-image {
              width: 100%;
              height: 200px;
              overflow: hidden;
              background: #e2e8f0;
            }
            .post-image img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .post-content {
              padding: 1.5rem;
            }
            .post-title {
              color: #1a202c;
              font-size: 1.25rem;
              margin-bottom: 0.75rem;
              line-height: 1.4;
            }
            .post-meta {
              display: flex;
              gap: 1rem;
              margin-bottom: 1rem;
              font-size: 0.875rem;
              color: #718096;
            }
            .post-meta span {
              display: flex;
              align-items: center;
              gap: 0.25rem;
            }
            .post-excerpt {
              color: #4a5568;
              margin-bottom: 1rem;
              line-height: 1.6;
            }
            .read-more {
              color: #667eea;
              text-decoration: none;
              font-weight: 500;
              display: inline-flex;
              align-items: center;
              gap: 0.25rem;
            }
            .read-more:hover {
              color: #5a67d8;
            }
            .load-more {
              text-align: center;
              padding: 2rem;
            }
            .loading {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 1rem;
              color: #718096;
              font-size: 1.125rem;
            }
            .end-message {
              color: #718096;
              font-size: 1.125rem;
              padding: 2rem;
            }
            .spinner {
              display: inline-block;
              width: 2rem;
              height: 2rem;
              border: 3px solid #e2e8f0;
              border-top: 3px solid #667eea;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @media (max-width: 768px) {
              .posts-list {
                grid-template-columns: 1fr;
              }
            }
          `
        ),
      ],
      children: [
        html.div(
          { class: 'header' },
          html.div(
            { class: 'header-content' },
            html.h1(null, 'Infinite Scroll'),
            html.p(null, 'Scroll down to load more posts automatically')
          )
        ),
        html.div(
          { class: 'container' },
          PostsList(initialPosts) as any,
          LoadMoreTrigger(2, true) as any
        ),
      ],
    })
  );
}

/**
 * HTTP Handlers
 */
const POSTS_PER_PAGE = 9;
const TOTAL_POSTS = 100;

export const handlers = {
  // GET / - Show infinite scroll page
  index: () => {
    const initialPosts = generatePosts(1, POSTS_PER_PAGE);

    return new Response(InfiniteScrollPage(initialPosts), {
      headers: { 'Content-Type': 'text/html' },
    });
  },

  // GET /posts?page=N - Load more posts
  loadMore: (request: Request) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    const start = (page - 1) * POSTS_PER_PAGE + 1;
    const posts = generatePosts(start, POSTS_PER_PAGE);

    const hasMore = start + POSTS_PER_PAGE < TOTAL_POSTS;

    const html = PostsList(posts) + LoadMoreTrigger(page + 1, hasMore);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};

/**
 * Virtualized infinite scroll (for very large lists)
 */
export class VirtualScroller {
  private itemHeight: number;
  private visibleCount: number;
  private totalCount: number;
  private items: any[];

  constructor(
    itemHeight: number,
    visibleCount: number,
    totalCount: number,
    items: any[]
  ) {
    this.itemHeight = itemHeight;
    this.visibleCount = visibleCount;
    this.totalCount = totalCount;
    this.items = items;
  }

  /**
   * Get visible items based on scroll position
   */
  getVisibleItems(scrollTop: number): { start: number; end: number; items: any[] } {
    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.min(start + this.visibleCount, this.totalCount);

    return {
      start,
      end,
      items: this.items.slice(start, end),
    };
  }

  /**
   * Get total height
   */
  getTotalHeight(): number {
    return this.totalCount * this.itemHeight;
  }

  /**
   * Get offset for current position
   */
  getOffset(start: number): number {
    return start * this.itemHeight;
  }
}
