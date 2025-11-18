# Playwright - Elide Polyglot Showcase

> **Cross-browser automation for ALL languages** - TypeScript, Python, Ruby, and Java

Automate Chromium, Firefox, and WebKit with a single API.

## Features

- Multi-browser support (Chrome, Firefox, Safari)
- Auto-wait for elements
- Network interception
- Mobile emulation
- Video recording
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies (core logic)

## Quick Start

```typescript
import { chromium, firefox, webkit } from './elide-playwright.ts';

// Chromium
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await page.screenshot({ path: 'screenshot.png' });
await browser.close();

// Firefox
const ffBrowser = await firefox.launch();

// WebKit (Safari)
const wkBrowser = await webkit.launch();
```

## Use Cases

- E2E testing
- Cross-browser testing
- Web scraping
- Visual regression testing
- Performance testing

## Stats

- **npm downloads**: ~3M+/week
- **Use case**: Cross-browser automation
- **Elide advantage**: Consistent testing across all languages and browsers
