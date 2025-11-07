#!/usr/bin/env python3
"""
Python Integration Example for elide-entities

This demonstrates calling the TypeScript HTML entities implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One entity encoder shared across TypeScript and Python
- Consistent HTML safety across services
- No Python html library needed
- Guaranteed XSS protection consistency
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# entities = require('./elide-entities.ts')

print("=== Python Calling TypeScript HTML Entities ===\n")

# Example 1: Encode dangerous user input
# user_input = '<script>alert("XSS")</script>'
# safe = entities.encode(user_input)
# print(f"Safe: {safe}")

# Example 2: Flask/Django Template Rendering
# from flask import Flask, render_template_string
#
# @app.route('/comment', methods=['POST'])
# def handle_comment():
#     comment = request.form['comment']
#     # Encode user input for safe display
#     safe_comment = entities.escapeHTML(comment)
#     return render_template_string('<div>{{ comment }}</div>', comment=safe_comment)

# Example 3: XML/RSS Feed Generation
# def generate_rss_item(title: str, description: str) -> str:
#     """Generate RSS item with encoded content"""
#     safe_title = entities.encodeXML(title)
#     safe_desc = entities.encodeXML(description)
#     return f"""
#     <item>
#         <title>{safe_title}</title>
#         <description>{safe_desc}</description>
#     </item>
#     """

# Example 4: Email Template Generation
# def create_email_html(user_name: str, message: str) -> str:
#     """Create HTML email with safe content"""
#     safe_name = entities.escapeHTML(user_name)
#     safe_message = entities.escapeHTML(message)
#     return f"""
#     <html>
#         <body>
#             <h1>Hello {safe_name}</h1>
#             <p>{safe_message}</p>
#         </body>
#     </html>
#     """

print("Real-world use case:")
print("- Python API encodes user input for XSS prevention")
print("- Uses same TypeScript implementation as Node.js frontend")
print("- Guarantees consistent HTML safety across stack")
print("- No need to install Python html library")
print()

print("Example: Content Management System")
print("┌─────────────────────────────────────────────┐")
print("│   Elide HTML Entities (TypeScript)         │")
print("│   elide-entities.ts                        │")
print("└─────────────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │Frontend│          │  API   │")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same XSS protection everywhere!")
print()

print("Problem Solved:")
print("Before: Different encoding = potential XSS vulnerabilities")
print("After: One Elide implementation = consistent security")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  entities = require('./elide-entities.ts')")
print("  safe = entities.encode(user_input)  # That's it!")
