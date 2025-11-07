/**
 * ElideHTML - Live Search Example
 *
 * Real-time search with htmx and debouncing.
 * Demonstrates search-as-you-type with minimal code.
 */

import { html, render } from '../../runtime/renderer.ts';
import { Layout, UI } from '../../runtime/components.ts';
import { htmx } from '../../helpers/htmx-helpers.ts';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

/**
 * Sample data for searching
 */
const sampleData: SearchResult[] = [
  {
    id: '1',
    title: 'ElideHTML',
    description: 'Ultra-fast server-side HTML rendering for htmx',
    category: 'Framework',
    tags: ['html', 'htmx', 'ssr', 'performance'],
  },
  {
    id: '2',
    title: 'HTMX',
    description: 'High-power tools for HTML',
    category: 'Library',
    tags: ['html', 'ajax', 'websockets'],
  },
  {
    id: '3',
    title: 'Alpine.js',
    description: 'Lightweight JavaScript framework',
    category: 'Framework',
    tags: ['javascript', 'reactive', 'lightweight'],
  },
  {
    id: '4',
    title: 'Tailwind CSS',
    description: 'Utility-first CSS framework',
    category: 'Styling',
    tags: ['css', 'utility', 'design'],
  },
  {
    id: '5',
    title: 'TypeScript',
    description: 'JavaScript with syntax for types',
    category: 'Language',
    tags: ['typescript', 'types', 'javascript'],
  },
  {
    id: '6',
    title: 'Deno',
    description: 'Modern JavaScript runtime',
    category: 'Runtime',
    tags: ['javascript', 'typescript', 'runtime'],
  },
  {
    id: '7',
    title: 'Svelte',
    description: 'Cybernetically enhanced web apps',
    category: 'Framework',
    tags: ['javascript', 'compiler', 'reactive'],
  },
  {
    id: '8',
    title: 'Solid.js',
    description: 'Simple and performant reactivity',
    category: 'Framework',
    tags: ['javascript', 'reactive', 'performance'],
  },
  {
    id: '9',
    title: 'Astro',
    description: 'Static site builder for speed',
    category: 'Framework',
    tags: ['static', 'ssg', 'performance'],
  },
  {
    id: '10',
    title: 'Fresh',
    description: 'Next-gen web framework for Deno',
    category: 'Framework',
    tags: ['deno', 'ssr', 'islands'],
  },
];

/**
 * Search function
 */
export function search(query: string): SearchResult[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const lowerQuery = query.toLowerCase();

  return sampleData.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Render search result item
 */
export function SearchResultItem(result: SearchResult): string {
  return render(
    html.div(
      { class: 'search-result-item' },
      html.div(
        { class: 'result-header' },
        html.h3(null, result.title),
        UI.Badge({ variant: 'secondary' }, [result.category])
      ),
      html.p({ class: 'result-description' }, result.description),
      html.div(
        { class: 'result-tags' },
        ...result.tags.map((tag) =>
          html.span({ class: 'tag' }, tag)
        )
      )
    )
  );
}

/**
 * Render search results
 */
export function SearchResults(results: SearchResult[], query: string): string {
  if (!query || query.trim() === '') {
    return render(
      html.div(
        { id: 'search-results', class: 'search-results' },
        html.div({ class: 'empty-state' }, 'Start typing to search...')
      )
    );
  }

  if (results.length === 0) {
    return render(
      html.div(
        { id: 'search-results', class: 'search-results' },
        html.div({ class: 'empty-state' }, `No results found for "${query}"`)
      )
    );
  }

  return render(
    html.div(
      { id: 'search-results', class: 'search-results' },
      html.div(
        { class: 'results-header' },
        `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`
      ),
      ...results.map((result) => SearchResultItem(result) as any)
    )
  );
}

/**
 * Render search page
 */
export function SearchPage(): string {
  return render(
    Layout.Document({
      title: 'ElideHTML Live Search',
      htmx: true,
      head: [
        html.style(
          null,
          `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            .container { max-width: 800px; margin: 0 auto; }
            .search-header { text-align: center; color: white; margin-bottom: 2rem; }
            .search-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
            .search-header p { font-size: 1.125rem; opacity: 0.9; }
            .search-box {
              background: white;
              padding: 1rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              margin-bottom: 2rem;
            }
            .search-input {
              width: 100%;
              padding: 1rem;
              border: 2px solid #e2e8f0;
              border-radius: 6px;
              font-size: 1.125rem;
              transition: border-color 0.2s;
            }
            .search-input:focus {
              outline: none;
              border-color: #667eea;
            }
            .search-results {
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .empty-state {
              padding: 3rem;
              text-align: center;
              color: #999;
              font-size: 1.125rem;
            }
            .results-header {
              padding: 1rem 1.5rem;
              background: #f7fafc;
              border-bottom: 1px solid #e2e8f0;
              font-weight: 500;
              color: #4a5568;
            }
            .search-result-item {
              padding: 1.5rem;
              border-bottom: 1px solid #e2e8f0;
              transition: background-color 0.2s;
            }
            .search-result-item:last-child { border-bottom: none; }
            .search-result-item:hover { background: #f7fafc; }
            .result-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 0.5rem;
            }
            .result-header h3 {
              color: #2d3748;
              font-size: 1.25rem;
            }
            .result-description {
              color: #718096;
              margin-bottom: 0.75rem;
            }
            .result-tags {
              display: flex;
              gap: 0.5rem;
              flex-wrap: wrap;
            }
            .tag {
              padding: 0.25rem 0.75rem;
              background: #edf2f7;
              color: #4a5568;
              border-radius: 4px;
              font-size: 0.875rem;
            }
            .badge {
              padding: 0.25rem 0.75rem;
              border-radius: 4px;
              font-size: 0.875rem;
              font-weight: 500;
            }
            .badge-secondary {
              background: #667eea;
              color: white;
            }
            .htmx-indicator {
              display: inline-block;
              width: 1rem;
              height: 1rem;
              border: 2px solid #f3f3f3;
              border-top: 2px solid #667eea;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-left: 0.5rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        ),
      ],
      children: [
        html.div(
          { class: 'container' },
          html.div(
            { class: 'search-header' },
            html.h1(null, 'Live Search'),
            html.p(null, 'Search as you type with htmx')
          ),
          html.div(
            { class: 'search-box' },
            html.input({
              type: 'search',
              name: 'q',
              placeholder: 'Search for frameworks, libraries, tools...',
              class: 'search-input',
              autocomplete: 'off',
              autofocus: true,
              ...htmx.liveSearch('/search', '300ms'),
            }),
            html.div({ class: 'htmx-indicator' })
          ),
          SearchResults([], '') as any
        ),
      ],
    })
  );
}

/**
 * HTTP Handlers
 */
export const handlers = {
  // GET / - Show search page
  index: () => {
    return new Response(SearchPage(), {
      headers: { 'Content-Type': 'text/html' },
    });
  },

  // GET /search - Perform search
  search: (request: Request) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    // Simulate network delay
    const results = search(query);

    return new Response(SearchResults(results, query), {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};

/**
 * Advanced search with filters
 */
export function searchWithFilters(
  query: string,
  category?: string,
  tags?: string[]
): SearchResult[] {
  let results = search(query);

  if (category) {
    results = results.filter((r) => r.category === category);
  }

  if (tags && tags.length > 0) {
    results = results.filter((r) => tags.some((tag) => r.tags.includes(tag)));
  }

  return results;
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(sampleData.map((item) => item.category)));
}

/**
 * Get all tags
 */
export function getTags(): string[] {
  return Array.from(new Set(sampleData.flatMap((item) => item.tags)));
}
