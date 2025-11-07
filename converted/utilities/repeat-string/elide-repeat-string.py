#!/usr/bin/env python3
"""
Python Integration Example for elide-repeat-string

This demonstrates calling the TypeScript repeat-string implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One repeat-string implementation shared across TypeScript and Python
- Consistent repeat a string n times efficiently across services
- No Python custom implementation needed
- Perfect for text formatting, padding, ASCII art, UI borders
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# repeat_string_module = require('./elide-repeat-string.ts')

print("=== Python Calling TypeScript repeat-string ===\n")

# Example: Basic usage
# result = repeat_string_module.default()
# print(f"Result: {result}")

print("Real-world use case:")
print("- Python service uses repeat a string n times efficiently")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent behavior across entire stack")
print("- Perfect for text formatting, padding, ASCII art, UI borders")
print()

print("Example: Microservices Architecture")
print("┌─────────────────────────────────────┐")
print("│   Elide repeat-string (TypeScript)         │")
print("│   conversions/repeat-string/elide-repeat-string.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same repeat a string n times efficiently everywhere!")
print()

print("Problem Solved:")
print("Before: Python custom implementation + JavaScript = inconsistencies")
print("After: One Elide implementation = 100% consistent")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  repeat_string = require('./elide-repeat-string.ts')")
print("  # Use it directly!")
