#!/usr/bin/env python3
"""
Python Integration Example for elide-random-int

This demonstrates calling the TypeScript random-int implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One random-int implementation shared across TypeScript and Python
- Consistent generate a random integer within a range across services
- No Python custom implementation needed
- Perfect for ID generation, sampling, testing, games
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# random_int_module = require('./elide-random-int.ts')

print("=== Python Calling TypeScript random-int ===\n")

# Example: Basic usage
# result = random_int_module.default()
# print(f"Result: {result}")

print("Real-world use case:")
print("- Python service uses generate a random integer within a range")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent behavior across entire stack")
print("- Perfect for ID generation, sampling, testing, games")
print()

print("Example: Microservices Architecture")
print("┌─────────────────────────────────────┐")
print("│   Elide random-int (TypeScript)         │")
print("│   conversions/random-int/elide-random-int.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same generate a random integer within a range everywhere!")
print()

print("Problem Solved:")
print("Before: Python custom implementation + JavaScript = inconsistencies")
print("After: One Elide implementation = 100% consistent")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  random_int = require('./elide-random-int.ts')")
print("  # Use it directly!")
