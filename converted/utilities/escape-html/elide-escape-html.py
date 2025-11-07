#!/usr/bin/env python3
"""
Python Integration Example for elide-escape-html (HTML Entity Escaper)

Demonstrates calling the TypeScript escape-html implementation from Python
for consistent XSS protection and HTML escaping across all services.

Benefits:
- One HTML escaper shared across TypeScript and Python
- Consistent XSS prevention across web services
- No Python-specific escaping quirks or library differences
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# from elide import require
# escape_html = require('./elide-escape-html.ts')

print("=== Python Calling TypeScript Escape HTML ===\n")

# Example 1: Basic HTML escaping
# dangerous = "<script>alert('XSS')</script>"
# safe = escape_html(dangerous)
# print(f"Dangerous: {dangerous}")
# print(f"Safe: {safe}")
# # Output: &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;

# Example 2: User comment sanitization
# comment = "I love <3 this & that's \"great\"!"
# safe_comment = escape_html(comment)
# print(f"\nComment: {comment}")
# print(f"Safe: {safe_comment}")
# # Output: I love &lt;3 this &amp; that&#39;s &quot;great&quot;!

# Example 3: Flask application with XSS protection
# from flask import Flask, request, jsonify
# app = Flask(__name__)
#
# # Use TypeScript HTML escaper from Python
# @app.route('/api/comment', methods=['POST'])
# def post_comment():
#     user_input = request.json.get('comment', '')
#
#     # Escape using shared TypeScript implementation
#     safe_comment = escape_html.escape(user_input)
#
#     # Save to database (now XSS-safe)
#     save_comment(safe_comment)
#
#     return jsonify({'comment': safe_comment, 'status': 'safe'})

# Example 4: Django template rendering
# # views.py
# from django.shortcuts import render
# from django.utils.safestring import mark_safe
#
# def user_profile(request):
#     user_bio = request.POST.get('bio', '')
#
#     # Escape using same implementation as Node.js service
#     safe_bio = escape_html.escape(user_bio)
#
#     context = {
#         'bio': mark_safe(safe_bio)  # Already escaped
#     }
#     return render(request, 'profile.html', context)

# Example 5: Email HTML generation
# def send_welcome_email(user_name, user_email):
#     # Escape user data to prevent HTML injection in emails
#     safe_name = escape_html.escape(user_name)
#     safe_email = escape_html.escape(user_email)
#
#     html_body = f"""
#     <html>
#         <body>
#             <h1>Welcome, {safe_name}!</h1>
#             <p>Your email: {safe_email}</p>
#         </body>
#     </html>
#     """
#
#     send_email(user_email, "Welcome", html_body)

# Example 6: API response sanitization
# from fastapi import FastAPI
# app = FastAPI()
#
# @app.get("/user/{user_id}")
# async def get_user(user_id: int):
#     user = get_user_from_db(user_id)
#
#     # Escape all user-generated content
#     return {
#         "name": escape_html.escape(user.name),
#         "bio": escape_html.escape(user.bio),
#         "website": escape_html.escape(user.website)
#     }

print("Real-world use case:")
print("- Python web service receives user input")
print("- Uses same HTML escaper as Node.js frontend")
print("- Guarantees identical XSS protection across entire stack")
print()

print("Example: Unified XSS Protection")
print("┌─────────────────────────────────────┐")
print("│   Elide Escape HTML (TypeScript)   │")
print("│   conversions/escape-html/*.ts     │")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  SSR   │          │  API   │")
print("    └────────┘          └────────┘")
print("     escapeHtml(input)   escapeHtml(input)")
print("     = &lt;safe&gt;      = &lt;safe&gt;")
print("     ✓ Consistent XSS prevention!")
print()

print("Problem Solved:")
print("Before: Node.js escapes differently than Python = XSS vulnerabilities")
print("After: One Elide implementation = unified XSS protection")
print()

print("Security Example:")
print("  # User input from form")
print("  user_input = '<script>alert(1)</script>'")
print("  ")
print("  # Escape using shared implementation")
print("  safe = escape_html(user_input)")
print("  # Result: &lt;script&gt;alert(1)&lt;/script&gt;")
print("  ")
print("  # Same escaping logic in Node.js, Python, Ruby, Java!")
print("  # One security standard = fewer vulnerabilities")
