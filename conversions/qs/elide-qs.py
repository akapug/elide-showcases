#!/usr/bin/env python3
"""
Python Integration Example for elide-qs

This demonstrates calling the TypeScript qs implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One qs implementation shared across TypeScript and Python
- Consistent parse and stringify url query strings across services
- No Python custom implementation needed
- Perfect for API query parameters, URL generation, form data parsing
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# qs_module = require('./elide-qs.ts')

print("=== Python Calling TypeScript qs ===\n")

# Example: Basic usage
# result = qs_module.default()
# print(f"Result: {result}")

print("Real-world use case:")
print("- Python service uses parse and stringify url query strings")
print("- Uses same TypeScript implementation as Node.js API")
print("- Guarantees consistent behavior across entire stack")
print("- Perfect for API query parameters, URL generation, form data parsing")
print()

print("Example: Microservices Architecture")
print("┌─────────────────────────────────────┐")
print("│   Elide qs (TypeScript)         │")
print("│   conversions/qs/elide-qs.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │Pipeline│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same parse and stringify url query strings everywhere!")
print()

print("Problem Solved:")
print("Before: Python custom implementation + JavaScript = inconsistencies")
print("After: One Elide implementation = 100% consistent")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  qs = require('./elide-qs.ts')")
print("  # Use it directly!")
