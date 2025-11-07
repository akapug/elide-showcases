#!/usr/bin/env python3
"""
Python Integration Example for elide-reverse-string

This demonstrates calling the TypeScript reverse-string implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One reverse-string implementation shared across TypeScript and Python
- Consistent reverse a string across services
- No Python custom implementation needed
- Perfect for text manipulation, palindrome checking, data reversal
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# reverse_string_module = require('./elide-reverse-string.ts')

print("=== Python Calling TypeScript reverse-string ===\n")

# Example: Basic usage
# result = reverse_string_module.default()
# print(f"Result: {result}")

print("Real-world use case:")
print("- Python service uses reverse a string")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent behavior across entire stack")
print("- Perfect for text manipulation, palindrome checking, data reversal")
print()

print("Example: Microservices Architecture")
print("┌─────────────────────────────────────┐")
print("│   Elide reverse-string (TypeScript)         │")
print("│   conversions/reverse-string/elide-reverse-string.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same reverse a string everywhere!")
print()

print("Problem Solved:")
print("Before: Python custom implementation + JavaScript = inconsistencies")
print("After: One Elide implementation = 100% consistent")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  reverse_string = require('./elide-reverse-string.ts')")
print("  # Use it directly!")
