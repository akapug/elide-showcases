#!/usr/bin/env python3
"""
Python Integration Example for elide-content-type

This demonstrates calling the TypeScript Content-Type implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One Content-Type parser shared across TypeScript and Python
- Consistent header handling across services
- No Python content-type library needed
- Guaranteed format consistency
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# content_type = require('./elide-content-type.ts')

print("=== Python Calling TypeScript Content-Type Parser ===\n")

# Example 1: Parse Content-Type Header
# ct = content_type.parse('application/json; charset=utf-8')
# print(f"Type: {ct['type']}")
# print(f"Charset: {ct['parameters'].get('charset')}")
# print()

# Example 2: Format Content-Type
# formatted = content_type.format({
#     'type': 'application/json',
#     'parameters': {'charset': 'utf-8'}
# })
# print(f"Formatted: {formatted}")
# print()

# Example 3: Flask/FastAPI Integration
# from flask import Flask, request, Response
#
# app = Flask(__name__)
#
# @app.route('/api/data', methods=['POST'])
# def handle_data():
#     # Parse incoming Content-Type
#     ct_header = request.headers.get('Content-Type', '')
#     if ct_header:
#         ct = content_type.parse(ct_header)
#         if content_type.isJSON(ct):
#             data = request.get_json()
#             # Process JSON data
#             return Response(
#                 json.dumps({'status': 'ok'}),
#                 headers={'Content-Type': 'application/json; charset=utf-8'}
#             )

# Example 4: API Response Handling
# def create_response(data, response_type='json'):
#     """Create API response with proper Content-Type"""
#     if response_type == 'json':
#         ct = content_type.format({
#             'type': 'application/json',
#             'parameters': {'charset': 'utf-8'}
#         })
#         body = json.dumps(data)
#     elif response_type == 'xml':
#         ct = content_type.format({
#             'type': 'application/xml',
#             'parameters': {'charset': 'utf-8'}
#         })
#         body = to_xml(data)
#
#     return {'body': body, 'headers': {'Content-Type': ct}}

# Example 5: Content Negotiation
# def negotiate_content_type(accept_header: str):
#     """Determine response format based on Accept header"""
#     # Parse client preferences
#     preferred_types = ['application/json', 'application/xml', 'text/html']
#
#     for pref in preferred_types:
#         if pref in accept_header:
#             return content_type.format({'type': pref, 'parameters': {'charset': 'utf-8'}})
#
#     # Default to JSON
#     return 'application/json; charset=utf-8'

print("Real-world use case:")
print("- Python API parses Content-Type for request handling")
print("- Uses same TypeScript implementation as Node.js service")
print("- Guarantees consistent content negotiation across stack")
print("- No need to install Python content-type library")
print()

print("Example: API Gateway")
print("┌─────────────────────────────────────────────┐")
print("│   Elide Content-Type (TypeScript)          │")
print("│   conversions/content-type/elide-content-type.ts│")
print("└─────────────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │ Service│")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same Content-Type handling everywhere!")
print()

print("Problem Solved:")
print("Before: Python cgi.parse_header + JavaScript content-type = different parsing")
print("After: One Elide implementation = 100% consistent headers")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  ct = require('./elide-content-type.ts')")
print("  parsed = ct.parse(header)  # That's it!")
