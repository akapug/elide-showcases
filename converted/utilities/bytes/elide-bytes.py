#!/usr/bin/env python3
"""
Python Integration Example for elide-bytes (Byte Formatter)

Demonstrates calling the TypeScript bytes implementation from Python
for consistent byte formatting across all services.

Benefits:
- One byte formatter shared across TypeScript and Python
- Consistent storage/bandwidth reporting across services
- No Python-specific formatting libraries needed
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# from elide import require
# bytes_module = require('./elide-bytes.ts')

print("=== Python Calling TypeScript Bytes ===\n")

# Example 1: Format byte sizes
# file_size = bytes_module.format(1024)
# print(f"1024 bytes = {file_size}")  # "1KB"
#
# mem_usage = bytes_module.format(1024 * 1024 * 512)
# print(f"Memory usage = {mem_usage}")  # "512MB"

# Example 2: Parse byte strings
# max_upload = bytes_module.parse('100MB')
# print(f"'100MB' = {max_upload} bytes")  # 104857600
#
# disk_quota = bytes_module.parse('5GB')
# print(f"'5GB' = {disk_quota} bytes")  # 5368709120

# Example 3: Flask API with consistent byte formatting
# from flask import Flask, jsonify
# app = Flask(__name__)
#
# # Configure limits using bytes
# MAX_UPLOAD_SIZE = bytes_module.parse('100MB')  # 104857600
# USER_QUOTA = bytes_module.parse('5GB')          # 5368709120
#
# @app.route('/api/storage/stats')
# def storage_stats():
#     disk_used = os.statvfs('/').f_blocks * os.statvfs('/').f_frsize
#     return jsonify({
#         'used': bytes_module.format(disk_used),      # Same format as Node.js!
#         'quota': bytes_module.format(USER_QUOTA)
#     })
#
# @app.route('/api/upload', methods=['POST'])
# def upload_file():
#     if request.content_length > MAX_UPLOAD_SIZE:
#         return jsonify({
#             'error': f'File too large. Max: {bytes_module.format(MAX_UPLOAD_SIZE)}'
#         }), 413

# Example 4: Django settings
# # settings.py
# FILE_UPLOAD_MAX_SIZE = bytes_module.parse('10MB')   # Same as Node.js config
# DATA_UPLOAD_MAX_MEMORY_SIZE = bytes_module.parse('5MB')
# SESSION_FILE_SIZE_LIMIT = bytes_module.parse('1MB')

# Example 5: Monitoring dashboard
# import psutil
#
# def get_system_stats():
#     mem = psutil.virtual_memory()
#     disk = psutil.disk_usage('/')
#
#     return {
#         'memory': {
#             'total': bytes_module.format(mem.total),
#             'used': bytes_module.format(mem.used),
#             'available': bytes_module.format(mem.available)
#         },
#         'disk': {
#             'total': bytes_module.format(disk.total),
#             'used': bytes_module.format(disk.used),
#             'free': bytes_module.format(disk.free)
#         }
#     }
#     # All formatted consistently with Node.js monitoring service!

print("Real-world use case:")
print("- Python monitoring service reads: disk_used = 1073741824 bytes")
print("- Uses same bytes formatter as Node.js dashboard")
print("- Guarantees identical '1GB' display across entire monitoring stack")
print()

print("Example: Unified Monitoring Dashboard")
print("┌─────────────────────────────────────┐")
print("│   Elide Bytes (TypeScript)         │")
print("│   conversions/bytes/elide-bytes.ts │")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │Dashboard│         │Monitor │")
print("    └────────┘          └────────┘")
print("     '1GB'               '1GB'")
print("     = 1073741824        = 1073741824")
print("     ✓ Consistent!")
print()

print("Problem Solved:")
print("Before: Node.js bytes + Python humanize = different formatting")
print("After: One Elide implementation = identical byte displays")
print()

print("Configuration Example:")
print("  # config.yml (shared by all services)")
print("  max_upload: '100MB'")
print("  user_quota: '5GB'")
print("  cache_size: '512MB'")
print("  ")
print("  # Both Node.js and Python parse identically:")
print("  max_bytes = bytes('100MB')  # 104857600 in both languages")
