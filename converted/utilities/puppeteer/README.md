# Puppeteer - Elide Polyglot Showcase

> **Headless Chrome automation for ALL languages** - TypeScript, Python, Ruby, and Java

Control Chrome/Chromium browser programmatically for testing and scraping.

## Features

- Headless browser control
- Web scraping
- Screenshot generation
- PDF rendering from HTML
- Form automation
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies (core logic)

## Quick Start

```typescript
import puppeteer from './elide-puppeteer.ts';

// Take screenshot
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
await page.screenshot({ path: 'screenshot.png' });
await browser.close();

// Generate PDF
await page.pdf({ path: 'page.pdf', format: 'A4' });

// Scrape data
const title = await page.evaluate(() => document.title);
```

## Use Cases

- Web scraping
- Automated testing
- HTML to PDF conversion
- Screenshot generation
- Form automation

## Stats

- **npm downloads**: ~5M+/week
- **Use case**: Headless browser automation
- **Elide advantage**: Consistent automation across all languages
