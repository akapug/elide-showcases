#!/usr/bin/env python3
"""
Python Integration Example for elide-nanoid (Compact ID Generator)

Demonstrates calling the TypeScript nanoid implementation from Python
for consistent compact URL-safe IDs across all services.

Benefits:
- One ID generator shared across TypeScript and Python
- Consistent ID format across all microservices
- No Python uuid library needed
- Shorter, URL-safe IDs (21 chars vs 36 for UUID)
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# from elide import require
# nanoid_module = require('./elide-nanoid.ts')

print("=== Python Calling TypeScript Nanoid ===\n")

# Example 1: Generate compact IDs
# id1 = nanoid_module.nanoid()
# print(f"ID 1: {id1}")  # e.g., "V1StGXR8_Z5jdHi6B-myT"
#
# id2 = nanoid_module.nanoid()
# print(f"ID 2: {id2}")  # e.g., "Uakgb_J5m9g-0JDMbcJqL"

# Example 2: Custom sizes
# short_id = nanoid_module.nanoid(10)
# print(f"Short ID (10): {short_id}")  # e.g., "IRFa-VaY2b"
#
# long_id = nanoid_module.nanoid(32)
# print(f"Long ID (32): {long_id}")  # e.g., "aWY7IFgXqVFRq_PqL5kTj7Pqb5hY3qT"

# Example 3: Custom alphabet (numbers only)
# numbers_gen = nanoid_module.customAlphabet(nanoid_module.alphabets.numbers)
# numeric_id = numbers_gen(10)
# print(f"Numeric ID: {numeric_id}")  # e.g., "7482910536"

# Example 4: Django models with compact IDs
# from django.db import models
#
# class UrlShortener(models.Model):
#     short_code = models.CharField(max_length=8, unique=True)
#     long_url = models.URLField()
#     created_at = models.DateTimeField(auto_now_add=True)
#
#     @staticmethod
#     def generate_short_code():
#         # Use nanoid for consistent short codes
#         alphanum = nanoid_module.customAlphabet(
#             nanoid_module.alphabets.alphanumeric, 8
#         )
#         return alphanum()
#
# # Create shortened URL
# shortener = UrlShortener(
#     short_code=UrlShortener.generate_short_code(),
#     long_url='https://example.com/very/long/url'
# )
# print(f"Short URL: https://short.ly/{shortener.short_code}")

# Example 5: Flask API with nanoid
# from flask import Flask, jsonify
# app = Flask(__name__)
#
# @app.route('/api/generate-id')
# def generate_id():
#     # Same ID format as Node.js API!
#     new_id = nanoid_module.nanoid(16)
#     return jsonify({"id": new_id})
#
# @app.route('/api/short-url', methods=['POST'])
# def create_short_url():
#     short_code_gen = nanoid_module.customAlphabet(
#         nanoid_module.alphabets.alphanumeric, 8
#     )
#     short_code = short_code_gen()
#     return jsonify({
#         "short_url": f"https://short.ly/{short_code}",
#         "short_code": short_code
#     })

# Example 6: Database IDs (shorter than UUID)
# import sqlite3
#
# def create_user(username, email):
#     user_id = f"user_{nanoid_module.nanoid(16)}"  # e.g., "user_V1StGXR8_Z5jdHi"
#     # Insert into database
#     # INSERT INTO users (id, username, email) VALUES (?, ?, ?)
#     return user_id

print("Real-world use case:")
print("- Python API generates short URL codes")
print("- Uses same nanoid as Node.js service")
print("- Guarantees identical ID format across entire stack")
print()

print("Example: URL Shortener")
print("┌─────────────────────────────────────┐")
print("│   Elide Nanoid (TypeScript)        │")
print("│   conversions/nanoid/elide-nanoid.ts│")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │  API   │")
print("    └────────┘          └────────┘")
print("     ID: 'aB3x9K1z'     ID: 'aB3x9K1z'")
print("     = 8 chars           = 8 chars")
print("     ✓ Consistent URL-safe IDs!")
print()

print("Problem Solved:")
print("Before: Node.js nanoid + Python uuid = different ID formats")
print("After: One Elide implementation = identical compact IDs")
print()

print("Configuration Example:")
print("  # Both Node.js and Python generate same format:")
print("  short_code = nanoid(8)  # 'aB3x9K1z' in both languages")
print("  url = f'https://short.ly/{short_code}'")
print()

print("Benefits:")
print("  ✓ 60% smaller than UUID (21 vs 36 chars)")
print("  ✓ URL-safe (no special encoding needed)")
print("  ✓ Collision-resistant")
print("  ✓ Consistent across all services")
