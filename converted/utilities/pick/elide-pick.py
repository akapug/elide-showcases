#!/usr/bin/env python3
"""
Python Integration Example for elide-pick

Benefits:
- One pick implementation shared across TypeScript and Python
- Consistent data projection across services
- No Python library needed
"""

print("=== Python Calling TypeScript Pick ===\n")
print("Real-world use case:")
print("- Python Flask/Django apps create DTOs")
print("- Uses same TypeScript implementation as Node.js service")
print("- Consistent data projection across entire stack")
print()
print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  pick = require('./elide-pick.ts')")
print("  dto = pick.default(user, 'id', 'username', 'email')  # That's it!")
