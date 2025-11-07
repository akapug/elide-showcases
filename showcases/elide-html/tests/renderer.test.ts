/**
 * ElideHTML - Renderer Tests
 */

import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Renderer, html, render, h } from '../runtime/renderer.ts';

Deno.test('Renderer - basic element rendering', () => {
  const result = render(html.div(null, 'Hello World'));
  assertStringIncludes(result, '<div>');
  assertStringIncludes(result, 'Hello World');
  assertStringIncludes(result, '</div>');
});

Deno.test('Renderer - element with attributes', () => {
  const result = render(
    html.div({ id: 'test', class: 'container' }, 'Content')
  );
  assertStringIncludes(result, 'id="test"');
  assertStringIncludes(result, 'class="container"');
});

Deno.test('Renderer - nested elements', () => {
  const result = render(
    html.div(
      { class: 'parent' },
      html.div({ class: 'child' }, 'Nested')
    )
  );
  assertStringIncludes(result, 'class="parent"');
  assertStringIncludes(result, 'class="child"');
  assertStringIncludes(result, 'Nested');
});

Deno.test('Renderer - void elements', () => {
  const result = render(html.input({ type: 'text', value: 'test' }));
  assertStringIncludes(result, '<input');
  assertStringIncludes(result, 'type="text"');
  assertStringIncludes(result, 'value="test"');
  assertEquals(result.includes('</input>'), false);
});

Deno.test('Renderer - HTML escaping', () => {
  const result = render(html.div(null, '<script>alert("xss")</script>'));
  assertStringIncludes(result, '&lt;script&gt;');
  assertStringIncludes(result, '&lt;/script&gt;');
  assertEquals(result.includes('<script>'), false);
});

Deno.test('Renderer - boolean attributes', () => {
  const result = render(html.input({ type: 'checkbox', checked: true }));
  assertStringIncludes(result, 'checked');
});

Deno.test('Renderer - null/undefined attributes', () => {
  const result = render(html.div({ id: 'test', class: null as any }));
  assertStringIncludes(result, 'id="test"');
  assertEquals(result.includes('class'), false);
});

Deno.test('Renderer - performance benchmark', () => {
  const renderer = new Renderer();
  const node = html.div(
    { class: 'container' },
    html.h1(null, 'Title'),
    html.p(null, 'Paragraph 1'),
    html.p(null, 'Paragraph 2'),
    html.ul(
      null,
      html.li(null, 'Item 1'),
      html.li(null, 'Item 2'),
      html.li(null, 'Item 3')
    )
  );

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    renderer.render(node);
  }
  const duration = performance.now() - start;

  console.log(`1000 renders took ${duration.toFixed(2)}ms`);
  console.log(`Average: ${(duration / 1000).toFixed(3)}ms per render`);
});

Deno.test('Renderer - caching', () => {
  const renderer = new Renderer();
  const node = html.div({ class: 'test' }, 'Cached content');

  const result1 = renderer.render(node, { cache: true, cacheKey: 'test1' });
  const result2 = renderer.render(node, { cache: true, cacheKey: 'test1' });

  assertEquals(result1, result2);

  const stats = renderer.getCacheStats();
  assertEquals(stats.templateCache, 1);
});

Deno.test('Renderer - streaming', async () => {
  const renderer = new Renderer();
  const node = html.div(
    null,
    html.h1(null, 'Title'),
    html.p(null, 'Content')
  );

  const chunks: string[] = [];
  for await (const chunk of renderer.renderStream(node)) {
    chunks.push(chunk);
  }

  const result = chunks.join('');
  assertStringIncludes(result, '<div>');
  assertStringIncludes(result, 'Title');
  assertStringIncludes(result, 'Content');
});

Deno.test('Renderer - helper function h()', () => {
  const node = h('div', { id: 'test' }, 'Hello');
  assertEquals(node.tag, 'div');
  assertEquals(node.attrs?.id, 'test');
  assertEquals(node.children?.[0], 'Hello');
});

Deno.test('Renderer - complex document', () => {
  const doc = html.html(
    { lang: 'en' },
    html.head(
      null,
      html.title('Test Page'),
      html.meta({ charset: 'utf-8' })
    ),
    html.body(
      null,
      html.header(null, html.h1(null, 'Header')),
      html.main(
        null,
        html.article(
          null,
          html.h2(null, 'Article Title'),
          html.p(null, 'Article content')
        )
      ),
      html.footer(null, 'Footer')
    )
  );

  const result = render(doc);
  assertStringIncludes(result, '<!DOCTYPE html>' || '<html');
  assertStringIncludes(result, '<title>Test Page</title>');
  assertStringIncludes(result, '<h1>Header</h1>');
});
