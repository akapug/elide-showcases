/**
 * ElideHTML - Example Server
 *
 * Complete example showing all features of ElideHTML with htmx.
 */

import { html, render } from '../runtime/renderer.ts';
import { Layout, UI, Htmx } from '../runtime/components.ts';
import { htmx, hx } from '../helpers/htmx-helpers.ts';
import { fragmentCache, cacheKey } from '../runtime/cache.ts';
import { form, rules, csrf } from '../helpers/forms.ts';
import { SseStream, createSseResponse } from '../helpers/sse.ts';

// Home page
function HomePage() {
  return Layout.Document({
    title: 'ElideHTML Demo',
    htmx: true,
    head: [
      html.style(
        null,
        `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 { color: #333; margin-bottom: 1rem; }
          h2 { color: #555; margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #667eea; }
          .demo-section { margin-bottom: 2rem; }
          .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s;
          }
          .btn-primary { background: #667eea; color: white; }
          .btn-primary:hover { background: #5a67d8; }
          .btn-secondary { background: #6c757d; color: white; }
          .form-control {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 1rem;
          }
          .search-results {
            margin-top: 1rem;
            padding: 1rem;
            background: #f7fafc;
            border-radius: 4px;
          }
          #clock {
            display: inline-block;
            padding: 1rem 2rem;
            background: #667eea;
            color: white;
            border-radius: 4px;
            font-size: 1.5rem;
            font-weight: bold;
          }
          .counter {
            font-size: 3rem;
            font-weight: bold;
            color: #667eea;
            text-align: center;
            margin: 2rem 0;
          }
        `
      ),
    ],
    children: [
      html.div(
        { class: 'container' },
        html.h1(null, '⚡ ElideHTML Demo'),
        html.p(
          null,
          'Demonstrating <1ms HTML rendering with htmx integration'
        ),

        // Demo 1: Auto-updating clock
        html.div(
          { class: 'demo-section' },
          html.h2(null, '1. Auto-Updating Clock'),
          html.p(null, 'Updates every second using htmx polling:'),
          html.div(
            {
              id: 'clock',
              ...htmx.poll('/api/time', '1s'),
            },
            'Loading...'
          )
        ),

        // Demo 2: Live search
        html.div(
          { class: 'demo-section' },
          html.h2(null, '2. Live Search'),
          html.p(null, 'Search-as-you-type with 300ms debounce:'),
          html.input({
            type: 'search',
            name: 'q',
            placeholder: 'Type to search...',
            class: 'form-control',
            ...htmx.liveSearch('/api/search', '300ms'),
          }),
          html.div({ id: 'search-results', class: 'search-results' })
        ),

        // Demo 3: Click counter
        html.div(
          { class: 'demo-section' },
          html.h2(null, '3. Click Counter'),
          html.p(null, 'Stateful counter with htmx:'),
          html.div({ id: 'counter', class: 'counter' }, '0'),
          html.button(
            {
              ...hx().post('/api/increment').target('#counter').swap('innerHTML').build(),
              class: 'btn btn-primary',
            },
            'Increment'
          )
        ),

        // Demo 4: Form with validation
        html.div(
          { class: 'demo-section' },
          html.h2(null, '4. Form with Validation'),
          html.p(null, 'HTMX form with real-time validation:'),
          html.div({ id: 'form-container' })
        )
      ),
    ],
  });
}

// Clock endpoint
function renderClock() {
  return html.div(
    { id: 'clock' },
    new Date().toLocaleTimeString()
  );
}

// Search endpoint
const searchData = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Ruby',
  'Java',
  'Go',
  'Rust',
  'Elixir',
  'PHP',
  'Swift',
];

function renderSearchResults(query: string) {
  if (!query) {
    return html.div(
      { id: 'search-results', class: 'search-results' },
      'Start typing to search...'
    );
  }

  const results = searchData.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  if (results.length === 0) {
    return html.div(
      { id: 'search-results', class: 'search-results' },
      `No results for "${query}"`
    );
  }

  return html.div(
    { id: 'search-results', class: 'search-results' },
    html.ul(
      null,
      ...results.map((result) => html.li(null, result))
    )
  );
}

// Counter state (in production, use proper state management)
let counter = 0;

function renderCounter() {
  return String(counter);
}

// Form
function renderForm() {
  const token = csrf.generate('demo-session');

  const contactForm = form('/api/submit', 'post')
    .csrf(token)
    .htmx('#form-result')
    .text('name', 'Name', {
      required: true,
      placeholder: 'Enter your name',
      rules: [rules.required(), rules.min(3)],
    })
    .email('email', 'Email', {
      required: true,
      placeholder: 'your@email.com',
      rules: [rules.required(), rules.email()],
    });

  return render(
    html.div(
      null,
      contactForm.render(),
      html.div({ id: 'form-result' })
    )
  );
}

// SSE endpoint for live updates
function handleSSE() {
  const stream = new SseStream();
  let count = 0;

  const timer = setInterval(() => {
    if (stream.isClosed()) {
      clearInterval(timer);
      return;
    }

    stream.send({
      event: 'count',
      data: { count: count++ },
    });
  }, 1000);

  return createSseResponse(stream);
}

// Router
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Home page
  if (url.pathname === '/') {
    return new Response(render(HomePage()), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Clock API
  if (url.pathname === '/api/time') {
    return new Response(render(renderClock()), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Search API
  if (url.pathname === '/api/search') {
    const query = url.searchParams.get('q') || '';
    return new Response(render(renderSearchResults(query)), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Counter API
  if (url.pathname === '/api/increment' && req.method === 'POST') {
    counter++;
    return new Response(renderCounter(), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Form endpoint
  if (url.pathname === '/api/submit' && req.method === 'POST') {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    return new Response(
      render(
        html.div(
          { id: 'form-result', class: 'alert alert-success' },
          `Thanks ${name}! We'll contact you at ${email}.`
        )
      ),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // SSE endpoint
  if (url.pathname === '/api/events') {
    return handleSSE();
  }

  // 404
  return new Response('Not Found', { status: 404 });
}

// Start server
if (import.meta.main) {
  console.log('🚀 ElideHTML Demo Server');
  console.log('📍 http://localhost:8000');
  console.log('');
  console.log('Features:');
  console.log('  • Auto-updating clock');
  console.log('  • Live search');
  console.log('  • Click counter');
  console.log('  • Form validation');
  console.log('');

  Deno.serve({ port: 8000 }, handleRequest);
}
