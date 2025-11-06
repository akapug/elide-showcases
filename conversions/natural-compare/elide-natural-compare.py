#!/usr/bin/env python3
"""
Python Integration Example for elide-natural-compare

This demonstrates calling the TypeScript natural-compare implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One natural-compare implementation shared across TypeScript and Python
- Consistent natural sort order comparison for strings with numbers across services
- No Python custom implementation needed
- Perfect for file listings, version sorting, human-friendly sorting
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# natural_compare_module = require('./elide-natural-compare.ts')

print("=== Python Calling TypeScript natural-compare ===\n")

# Example: Basic usage
# result = natural_compare_module.default()
# print(f"Result: {result}")

print("Real-world use case:")
print("- Python service uses natural sort order comparison for strings with numbers")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent behavior across entire stack")
print("- Perfect for file listings, version sorting, human-friendly sorting")
print()

print("Example: Microservices Architecture")
print("┌─────────────────────────────────────┐")
print("│   Elide natural-compare (TypeScript)         │")
print("│   conversions/natural-compare/elide-natural-compare.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same natural sort order comparison for strings with numbers everywhere!")
print()

print("Problem Solved:")
print("Before: Python custom implementation + JavaScript = inconsistencies")
print("After: One Elide implementation = 100% consistent")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  natural_compare = require('./elide-natural-compare.ts')")
print("  # Use it directly!")
