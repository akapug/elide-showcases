#!/usr/bin/env python3
"""
Python Integration Example for elide-fast-json-stable-stringify
"""

# from elide import require
# stringify = require('./elide-fast-json-stable-stringify.ts')

print("=== Python Calling TypeScript Stable Stringify ===\n")

# Example: Generate cache keys
# data = {"page": 1, "limit": 10, "sort": "name"}
# cache_key = stringify.stringify(data)
# print(f"Cache key: {cache_key}")

# Example: Deterministic hashing
# def hash_object(obj):
#     json_str = stringify.stringify(obj)
#     return hashlib.sha256(json_str.encode()).hexdigest()

print("Real-world use case:")
print("- Python API needs consistent cache keys")
print("- Uses same TypeScript implementation as Node.js")
print("- Guarantees identical JSON across services")
print()

print("When Elide Python API is ready:")
print("  from elide import require")
print("  stringify = require('./elide-fast-json-stable-stringify.ts')")
print("  key = stringify.stringify(data)")
