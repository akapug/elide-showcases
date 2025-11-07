#!/usr/bin/env python3
"""
Python Integration Example for Base64 Codec

This demonstrates calling the TypeScript base64-codec implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One Base64 implementation shared across TypeScript and Python
- URL-safe encoding available everywhere
- Consistent encoding/decoding behavior
"""

# Import the TypeScript module
# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# from elide import require
# codec = require('./base64-codec.ts')

print("=== Python Calling TypeScript Base64 Codec ===\n")

# Example 1: Encode string
# text = "Hello, Elide!"
# encoded = codec.encode(text)
# print(f"Encoded: {encoded}")

# Example 2: Decode string
# decoded = codec.decode(encoded)
# print(f"Decoded: {decoded}")

# Example 3: URL-safe encoding
# url_text = "test+data/value="
# url_encoded = codec.encodeURL(url_text)
# print(f"URL-safe: {url_encoded}")

# Example 4: Validation
# is_valid = codec.isValidBase64(encoded)
# print(f"Valid Base64: {is_valid}")

print("Real-world use case:")
print("- Python API encodes auth tokens")
print("- Uses same TypeScript implementation as frontend")
print("- Guarantees identical encoding across services")
print()

print("Problem Solved:")
print("Before: Python base64 module + JavaScript btoa/atob = different edge cases")
print("After: One Elide implementation = consistent encoding everywhere")
