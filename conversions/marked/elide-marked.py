#!/usr/bin/env python3
"""
Python Integration Example for elide-marked (Markdown Parser)

Demonstrates calling the TypeScript marked implementation from Python
for consistent markdown rendering across all documentation services.

Benefits:
- One markdown parser shared across TypeScript and Python
- Consistent HTML output for docs across all languages
- No Python markdown library needed
- GitHub Flavored Markdown (GFM) support everywhere
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# from elide import require
# marked_module = require('./elide-marked.ts')

print("=== Python Calling TypeScript Marked ===\n")

# Example 1: Parse markdown to HTML
# markdown = "# Hello World\n\nThis is **bold** and *italic*."
# html = marked_module.default(markdown)
# print(f"Markdown: {markdown}")
# print(f"HTML: {html}")
# Output: <h1 id="hello-world">Hello World</h1>\n\n<p>This is <strong>bold</strong> and <em>italic</em>.</p>

# Example 2: Flask documentation endpoint
# from flask import Flask, jsonify
# app = Flask(__name__)
#
# @app.route('/docs/<path:doc_id>')
# def render_doc(doc_id):
#     # Load markdown from database
#     markdown_content = db.get_doc(doc_id)
#
#     # Render using same parser as Node.js docs site!
#     html = marked_module.default(markdown_content)
#
#     return jsonify({
#         'html': html,
#         'markdown': markdown_content
#     })

# Example 3: README rendering for Python package registry
# def render_package_readme(package_name):
#     readme_md = get_readme_from_package(package_name)
#
#     # Same rendering as npm registry!
#     html = marked_module.default(readme_md, {
#         'gfm': True,           # GitHub Flavored Markdown
#         'headerIds': True,      # Generate header IDs
#         'headerPrefix': 'pkg-'
#     })
#
#     return html

# Example 4: Django blog with markdown posts
# from django.views import View
# from django.shortcuts import render
#
# class BlogPostView(View):
#     def get(self, request, slug):
#         post = BlogPost.objects.get(slug=slug)
#
#         # Convert markdown to HTML using same parser
#         post.html_content = marked_module.default(post.markdown_content)
#
#         return render(request, 'blog/post.html', {'post': post})

print("Real-world use case:")
print("- Python docs API reads markdown from database")
print("- Uses same marked parser as Node.js frontend")
print("- Guarantees identical HTML output across entire docs platform")
print()

print("Example: Unified Documentation Platform")
print("┌─────────────────────────────────────┐")
print("│   Elide Marked (TypeScript)        │")
print("│   conversions/marked/elide-marked.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  Docs  │          │  API   │")
print("    └────────┘          └────────┘")
print("     README.md           README.md")
print("     ↓ Same HTML ↓      ↓ Same HTML ↓")
print("     ✓ Consistent rendering!")
print()

print("Problem Solved:")
print("Before: python-markdown vs marked.js = different HTML output")
print("After: One Elide implementation = identical rendering everywhere")
print()

print("Configuration Example:")
print("  # Parse with GFM (GitHub Flavored Markdown)")
print("  html = marked(markdown, {")
print("      'gfm': True,        # Tables, task lists, strikethrough")
print("      'breaks': False,     # Disable line breaks")
print("      'headerIds': True,   # Generate IDs for headers")
print("      'headerPrefix': 'doc-'")
print("  })")
print()

print("Benefits:")
print("  ✓ Consistent markdown rendering across Python and Node.js")
print("  ✓ Same HTML output for README files")
print("  ✓ No markdown parsing bugs between languages")
print("  ✓ GitHub Flavored Markdown support everywhere")
