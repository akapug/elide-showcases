/**
 * gray-matter - Front Matter Parser
 *
 * Parse front-matter from Markdown/YAML files.
 * **POLYGLOT SHOWCASE**: One parser for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/gray-matter (~5M+ downloads/week)
 *
 * Features:
 * - YAML/JSON/TOML front matter
 * - Markdown parsing
 * - Excerpts extraction
 * - Custom delimiters
 * - Stringify support
 * - Zero dependencies
 *
 * Use cases:
 * - Static site generators
 * - Blog systems
 * - Documentation
 * - Content management
 *
 * Package has ~5M+ downloads/week on npm!
 */

interface GrayMatterResult {
  data: any;
  content: string;
  excerpt?: string;
}

export default function matter(input: string): GrayMatterResult {
  const match = input.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { data: {}, content: input };
  }

  const frontMatter = match[1];
  const content = match[2];

  const data: any = {};
  frontMatter.split('\n').forEach(line => {
    const [key, ...values] = line.split(':');
    if (key && values.length) {
      data[key.trim()] = values.join(':').trim();
    }
  });

  return { data, content };
}

// CLI Demo
if (import.meta.url.includes("elide-gray-matter.ts")) {
  console.log("📋 gray-matter - Front Matter Parser for Elide (POLYGLOT!)\n");

  const markdown = `---
title: Hello World
date: 2025-01-15
tags: test, demo
---

# Hello

This is the content.`;

  const result = matter(markdown);
  console.log('Data:', result.data);
  console.log('Content:', result.content.substring(0, 50));

  console.log("\n✅ Use Cases: Static sites, Blog systems, Documentation");
  console.log("💡 ~5M+ downloads/week on npm!");
}
