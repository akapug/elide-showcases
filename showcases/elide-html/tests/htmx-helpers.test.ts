/**
 * ElideHTML - HTMX Helpers Tests
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { hx, htmx, hxResponse } from '../helpers/htmx-helpers.ts';

Deno.test('HxBuilder - GET request', () => {
  const attrs = hx().get('/api/data').build();
  assertEquals(attrs['hx-get'], '/api/data');
});

Deno.test('HxBuilder - POST request', () => {
  const attrs = hx().post('/api/create').build();
  assertEquals(attrs['hx-post'], '/api/create');
});

Deno.test('HxBuilder - target and swap', () => {
  const attrs = hx()
    .get('/api/data')
    .target('#content')
    .swap('innerHTML')
    .build();

  assertEquals(attrs['hx-get'], '/api/data');
  assertEquals(attrs['hx-target'], '#content');
  assertEquals(attrs['hx-swap'], 'innerHTML');
});

Deno.test('HxBuilder - trigger patterns', () => {
  const attrs = hx().get('/api/data').trigger('click').build();
  assertEquals(attrs['hx-trigger'], 'click');
});

Deno.test('HxBuilder - delayed trigger', () => {
  const attrs = hx().get('/api/search').triggerDelayed('500ms').build();
  assertEquals(attrs['hx-trigger'], 'keyup changed delay:500ms');
});

Deno.test('HxBuilder - every interval', () => {
  const attrs = hx().get('/api/status').triggerEvery('5s').build();
  assertEquals(attrs['hx-trigger'], 'every 5s');
});

Deno.test('HxBuilder - confirm', () => {
  const attrs = hx()
    .delete('/api/item/1')
    .confirm('Are you sure?')
    .build();

  assertEquals(attrs['hx-delete'], '/api/item/1');
  assertEquals(attrs['hx-confirm'], 'Are you sure?');
});

Deno.test('HxBuilder - headers', () => {
  const attrs = hx()
    .get('/api/data')
    .headers({ 'X-Custom': 'value' })
    .build();

  assertEquals(attrs['hx-headers'], '{"X-Custom":"value"}');
});

Deno.test('HxBuilder - vals', () => {
  const attrs = hx()
    .post('/api/submit')
    .vals({ extra: 'data' })
    .build();

  assertEquals(attrs['hx-vals'], '{"extra":"data"}');
});

Deno.test('htmx - infinite scroll', () => {
  const attrs = htmx.infiniteScroll('/api/load-more', 0.8);

  assertEquals(attrs['hx-get'], '/api/load-more');
  assertEquals(attrs['hx-trigger'], 'intersect threshold:0.8');
  assertEquals(attrs['hx-swap'], 'beforeend');
});

Deno.test('htmx - live search', () => {
  const attrs = htmx.liveSearch('/api/search', '300ms');

  assertEquals(attrs['hx-get'], '/api/search');
  assertEquals(attrs['hx-trigger'], 'keyup changed delay:300ms');
  assertEquals(attrs['hx-target'], '#search-results');
  assertEquals(attrs['hx-swap'], 'innerHTML');
});

Deno.test('htmx - delete with confirm', () => {
  const attrs = htmx.deleteWithConfirm('/api/item/1', 'Delete?');

  assertEquals(attrs['hx-delete'], '/api/item/1');
  assertEquals(attrs['hx-confirm'], 'Delete?');
  assertEquals(attrs['hx-swap'], 'outerHTML');
});

Deno.test('htmx - auto refresh', () => {
  const attrs = htmx.autoRefresh('/api/status', '10s');

  assertEquals(attrs['hx-get'], '/api/status');
  assertEquals(attrs['hx-trigger'], 'every 10s');
  assertEquals(attrs['hx-swap'], 'innerHTML');
});

Deno.test('htmx - lazy load', () => {
  const attrs = htmx.lazyLoad('/api/content');

  assertEquals(attrs['hx-get'], '/api/content');
  assertExists(attrs['hx-trigger']);
  assertEquals(attrs['hx-swap'], 'outerHTML');
});

Deno.test('htmx - form', () => {
  const attrs = htmx.form('/api/submit', 'post');

  assertEquals(attrs['hx-post'], '/api/submit');
  assertEquals(attrs['hx-validate'], true);
  assertEquals(attrs['hx-swap'], 'outerHTML');
});

Deno.test('htmx - out of band swap', () => {
  const attrs = htmx.oob('notifications', 'innerHTML');

  assertEquals(attrs['id'], 'notifications');
  assertEquals(attrs['hx-swap-oob'], 'innerHTML');
});

Deno.test('htmx - poll', () => {
  const attrs = htmx.poll('/api/updates', '5s');

  assertEquals(attrs['hx-get'], '/api/updates');
  assertEquals(attrs['hx-trigger'], 'every 5s');
  assertEquals(attrs['hx-swap'], 'innerHTML');
});

Deno.test('htmx - active search', () => {
  const attrs = htmx.activeSearch('/api/search', '200ms');

  assertEquals(attrs['hx-post'], '/api/search');
  assertEquals(attrs['hx-trigger'], 'keyup changed delay:200ms');
  assertEquals(attrs['hx-target'], '#search-results');
});

Deno.test('htmx - inline edit', () => {
  const { view, edit } = htmx.inlineEdit('/api/view/1', '/api/edit/1');

  assertEquals(view['hx-get'], '/api/view/1');
  assertEquals(view['hx-swap'], 'outerHTML');

  assertEquals(edit['hx-post'], '/api/edit/1');
  assertEquals(edit['hx-swap'], 'outerHTML');
});

Deno.test('htmx - dependent select', () => {
  const attrs = htmx.dependentSelect('/api/cities', 'city-select');

  assertEquals(attrs['hx-get'], '/api/cities');
  assertEquals(attrs['hx-trigger'], 'change');
  assertEquals(attrs['hx-target'], '#city-select');
  assertEquals(attrs['hx-swap'], 'innerHTML');
});

Deno.test('htmx - modal', () => {
  const attrs = htmx.modal('/api/modal-content', '#modal-container');

  assertEquals(attrs['hx-get'], '/api/modal-content');
  assertEquals(attrs['hx-target'], '#modal-container');
  assertEquals(attrs['hx-swap'], 'innerHTML');
});

Deno.test('HxResponse - trigger event', () => {
  const headers = hxResponse().trigger('myEvent').build();

  assertEquals(headers['HX-Trigger'], 'myEvent');
});

Deno.test('HxResponse - trigger with data', () => {
  const headers = hxResponse()
    .trigger({ event: 'data', value: 123 })
    .build();

  assertEquals(headers['HX-Trigger'], '{"event":"data","value":123}');
});

Deno.test('HxResponse - push URL', () => {
  const headers = hxResponse().pushUrl('/new-url').build();

  assertEquals(headers['HX-Push-Url'], '/new-url');
});

Deno.test('HxResponse - redirect', () => {
  const headers = hxResponse().redirect('/login').build();

  assertEquals(headers['HX-Redirect'], '/login');
});

Deno.test('HxResponse - refresh', () => {
  const headers = hxResponse().refresh().build();

  assertEquals(headers['HX-Refresh'], 'true');
});

Deno.test('HxResponse - reswap', () => {
  const headers = hxResponse().reswap('beforebegin').build();

  assertEquals(headers['HX-Reswap'], 'beforebegin');
});

Deno.test('HxResponse - retarget', () => {
  const headers = hxResponse().retarget('#new-target').build();

  assertEquals(headers['HX-Retarget'], '#new-target');
});

Deno.test('HxResponse - multiple headers', () => {
  const headers = hxResponse()
    .trigger('event1')
    .pushUrl('/new-path')
    .reswap('innerHTML')
    .build();

  assertEquals(headers['HX-Trigger'], 'event1');
  assertEquals(headers['HX-Push-Url'], '/new-path');
  assertEquals(headers['HX-Reswap'], 'innerHTML');
});
