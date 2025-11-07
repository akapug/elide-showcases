#!/usr/bin/env python3
"""
Python Integration Example for elide-ms (Time Duration Parser)

Demonstrates calling the TypeScript ms implementation from Python
for consistent time duration handling across all services.

Benefits:
- One time parser shared across TypeScript and Python
- Consistent timeout configuration across services
- No Python timedelta conversion needed
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# from elide import require
# ms_module = require('./elide-ms.ts')

print("=== Python Calling TypeScript MS ===\n")

# Example 1: Parse time strings
# timeout_ms = ms_module.parse('2h')
# print(f"'2h' = {timeout_ms}ms")  # 7200000
#
# cache_ttl = ms_module.parse('5 minutes')
# print(f"'5 minutes' = {cache_ttl}ms")  # 300000

# Example 2: Format milliseconds
# formatted = ms_module.format(60000)
# print(f"60000ms = {formatted}")  # "1m"
#
# formatted_long = ms_module.format(3600000, long=True)
# print(f"3600000ms (long) = {formatted_long}")  # "1 hour"

# Example 3: Flask API with consistent timeouts
# from flask import Flask
# app = Flask(__name__)
#
# # Configure timeouts using ms
# REQUEST_TIMEOUT = ms_module.parse('30s')  # 30000ms
# CACHE_TTL = ms_module.parse('5m')         # 300000ms
# SESSION_LIFETIME = ms_module.parse('24h') # 86400000ms
#
# @app.route('/api/data')
# @timeout(REQUEST_TIMEOUT)  # Same format as Node.js!
# def get_data():
#     return jsonify(data=fetch_data())

# Example 4: Django settings
# # settings.py
# CACHE_TIMEOUT = ms_module.parse('1h')    # Same as Node.js config
# SESSION_COOKIE_AGE = ms_module.parse('7d')
# CSRF_COOKIE_MAX_AGE = ms_module.parse('1y')

print("Real-world use case:")
print("- Python API reads config: timeout = '30s'")
print("- Uses same ms parser as Node.js service")
print("- Guarantees identical timeout values across entire stack")
print()

print("Example: Unified Configuration")
print("┌─────────────────────────────────────┐")
print("│   Elide MS (TypeScript)            │")
print("│   conversions/ms/elide-ms.ts       │")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │  API   │")
print("    └────────┘          └────────┘")
print("     timeout: '30s'      timeout: '30s'")
print("     = 30000ms           = 30000ms")
print("     ✓ Consistent!")
print()

print("Problem Solved:")
print("Before: Node.js ms + Python timedelta = different parsing")
print("After: One Elide implementation = identical time handling")
print()

print("Configuration Example:")
print("  # config.yml (shared by all services)")
print("  api_timeout: '30s'")
print("  cache_ttl: '5m'")
print("  session_lifetime: '24h'")
print("  ")
print("  # Both Node.js and Python parse identically:")
print("  timeout_ms = ms('30s')  # 30000ms in both languages")
