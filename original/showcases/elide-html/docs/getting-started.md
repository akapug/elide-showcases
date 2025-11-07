# Getting Started with ElideHTML

ElideHTML is designed to make server-side HTML rendering with htmx effortless and blazingly fast.

## Installation

### Deno

```typescript
import { html, render } from 'https://deno.land/x/elide_html/mod.ts';
import { htmx } from 'https://deno.land/x/elide_html/helpers/htmx-helpers.ts';
```

### Node.js / npm

```bash
npm install @elide/html
```

```typescript
import { html, render } from '@elide/html';
import { htmx } from '@elide/html/htmx';
```

### Bun

```bash
bun add @elide/html
```

## Basic Usage

### 1. Rendering HTML

The core of ElideHTML is the `html` builder and `render` function:

```typescript
import { html, render } from '@elide/html';

// Simple element
const greeting = html.div({ class: 'greeting' }, 'Hello World');
const result = render(greeting);
// <div class="greeting">Hello World</div>

// Nested elements
const card = html.div(
  { class: 'card' },
  html.h2(null, 'Card Title'),
  html.p(null, 'Card content goes here')
);
```

### 2. Adding HTMX

ElideHTML includes type-safe htmx helpers:

```typescript
import { htmx } from '@elide/html/htmx';

// Live search
const searchInput = html.input({
  type: 'search',
  name: 'q',
  placeholder: 'Search...',
  ...htmx.liveSearch('/api/search', '300ms')
});

// Infinite scroll trigger
const loadMore = html.div({
  ...htmx.infiniteScroll('/api/posts?page=2', 0.8),
  class: 'load-more'
});
```

### 3. Creating a Simple Server

Here's a complete example with Deno:

```typescript
import { html, render } from '@elide/html';
import { Layout } from '@elide/html/components';
import { htmx } from '@elide/html/htmx';

// Home page
function HomePage() {
  return Layout.Document({
    title: 'My App',
    htmx: true,
    children: [
      html.div(
        { class: 'container' },
        html.h1(null, 'Welcome'),
        html.button(
          {
            ...htmx.poll('/api/time', '1s'),
            id: 'clock'
          },
          'Loading...'
        )
      )
    ]
  });
}

// API endpoint
function CurrentTime() {
  return html.div(
    { id: 'clock' },
    new Date().toLocaleTimeString()
  );
}

// Server
Deno.serve((req) => {
  const url = new URL(req.url);

  if (url.pathname === '/') {
    return new Response(render(HomePage()), {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  if (url.pathname === '/api/time') {
    return new Response(render(CurrentTime()), {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  return new Response('Not Found', { status: 404 });
});
```

### 4. Using Components

ElideHTML includes pre-built components:

```typescript
import { UI, Form } from '@elide/html/components';

// UI components
const alert = UI.Alert({
  type: 'success',
  dismissible: true,
  children: ['Operation successful!']
});

const card = UI.Card({
  title: 'User Profile',
  children: [
    html.p(null, 'User information here')
  ]
});

// Form components
const nameField = Form.Group({
  label: 'Full Name',
  name: 'name',
  type: 'text',
  required: true
});
```

### 5. Adding Forms with Validation

```typescript
import { form, rules } from '@elide/html/forms';
import { csrf } from '@elide/html/forms';

// Create CSRF token
const token = csrf.generate('session-id');

// Build form
const contactForm = form('/api/contact', 'post')
  .csrf(token)
  .htmx('#form-result')
  .text('name', 'Name', {
    required: true,
    rules: [rules.required(), rules.min(3)]
  })
  .email('email', 'Email', {
    required: true,
    rules: [rules.required(), rules.email()]
  })
  .textarea('message', 'Message', {
    rules: [rules.max(500)]
  });

// Render form
const formHtml = contactForm.render();

// Handle submission
async function handleSubmit(req: Request) {
  const formData = await req.formData();
  const data = Object.fromEntries(formData);

  // Validate
  const result = contactForm.validate(data);

  if (!result.valid) {
    // Re-render with errors
    return new Response(
      contactForm.render(result.errors, data),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Process valid form
  return new Response('Success!');
}
```

### 6. Caching for Performance

```typescript
import { fragmentCache, cacheKey } from '@elide/html/cache';

function renderUserProfile(userId: string) {
  const key = cacheKey()
    .add('profile', userId)
    .build();

  // Check cache
  const cached = fragmentCache.get(key);
  if (cached) return cached;

  // Render and cache
  const html = render(createUserProfile(userId));
  fragmentCache.set(key, html, 60000); // 1 minute TTL

  return html;
}
```

### 7. Real-time Updates with SSE

```typescript
import { SseStream, createSseResponse } from '@elide/html/sse';

function handleSSE(req: Request) {
  const stream = new SseStream();

  // Send updates every second
  const timer = setInterval(() => {
    if (stream.isClosed()) {
      clearInterval(timer);
      return;
    }

    stream.send({
      event: 'update',
      data: { time: new Date().toISOString() }
    });
  }, 1000);

  return createSseResponse(stream);
}

// In HTML
const liveData = html.div({
  'hx-ext': 'sse',
  'sse-connect': '/api/events',
  'sse-swap': 'update'
});
```

## Next Steps

- [HTMX Helpers Guide](./htmx-helpers.md)
- [Component Reference](./components.md)
- [Caching Strategies](./caching.md)
- [Form Validation](./forms.md)
- [Examples](../examples/)

## Tips

1. **Use caching** for expensive renders
2. **Leverage htmx patterns** instead of custom JavaScript
3. **Keep components pure** for better testability
4. **Use TypeScript** for type safety
5. **Benchmark early** to identify bottlenecks

## Common Patterns

### Click to Edit

```typescript
const { view, edit } = htmx.inlineEdit('/view/1', '/edit/1');

const viewMode = html.div({ ...view }, 'Click to edit');
const editMode = html.input({ ...edit, value: 'Current value' });
```

### Dependent Dropdowns

```typescript
const countrySelect = html.select(
  {
    name: 'country',
    ...htmx.dependentSelect('/api/cities', 'city-select')
  },
  html.option({ value: 'us' }, 'United States')
);

const citySelect = html.select({ id: 'city-select', name: 'city' });
```

### Confirmation Dialogs

```typescript
const deleteBtn = html.button(
  {
    ...htmx.deleteWithConfirm('/api/item/1', 'Are you sure?'),
    class: 'btn-danger'
  },
  'Delete'
);
```

## Performance Tips

1. **Enable caching** for static/semi-static content
2. **Use streaming** for large responses
3. **Batch htmx requests** when possible
4. **Minimize template complexity**
5. **Profile with benchmarks** included in the package

---

Next: [HTMX Helpers Guide](./htmx-helpers.md)
