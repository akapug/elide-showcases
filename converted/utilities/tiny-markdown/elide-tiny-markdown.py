#!/usr/bin/env python3
"""
Python Integration Example for elide-tiny-markdown

This demonstrates calling the TypeScript tiny-markdown implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One tiny-markdown implementation shared across TypeScript and Python
- Consistent minimal markdown parser across services
- No Python custom implementation needed
- Perfect for comment rendering, documentation, content formatting
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# tiny_markdown_module = require('./elide-tiny-markdown.ts')

print("=== Python Calling TypeScript tiny-markdown ===\n")

# Example: Basic usage
# result = tiny_markdown_module.default()
# print(f"Result: {result}")

print("Real-world use case:")
print("- Python service uses minimal markdown parser")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent behavior across entire stack")
print("- Perfect for comment rendering, documentation, content formatting")
print()

print("Example: Microservices Architecture")
print("┌─────────────────────────────────────┐")
print("│   Elide tiny-markdown (TypeScript)         │")
print("│   conversions/tiny-markdown/elide-tiny-markdown.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same minimal markdown parser everywhere!")
print()

print("Problem Solved:")
print("Before: Python custom implementation + JavaScript = inconsistencies")
print("After: One Elide implementation = 100% consistent")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  tiny_markdown = require('./elide-tiny-markdown.ts')")
print("  # Use it directly!")
