#!/usr/bin/env python3
"""
Python Integration Example for elide-omit

This demonstrates calling the TypeScript omit implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One omit implementation shared across TypeScript and Python
- Consistent data sanitization across services
- No Python library needed
- Guaranteed security consistency
"""

print("=== Python Calling TypeScript Omit ===\n")

# Example: API Response Sanitization
# user_data = {
#     'id': 123,
#     'username': 'alice',
#     'email': 'alice@example.com',
#     'password': 'hashed_password',
#     'salt': 'random_salt',
#     'role': 'user'
# }
#
# from elide import require
# omit_module = require('./elide-omit.ts')
# safe_data = omit_module.default(user_data, 'password', 'salt')
# print(f"Safe data: {safe_data}")

# Example: Flask API Sanitization
# from flask import Flask, jsonify
# app = Flask(__name__)
#
# @app.route('/api/user/<int:user_id>')
# def get_user(user_id):
#     user = db.get_user(user_id)  # Full user record
#     safe_user = omit_module.default(user, 'password', 'salt', 'apiKey')
#     return jsonify(safe_user)

# Example: Django View Sanitization
# from django.http import JsonResponse
#
# def user_detail(request, user_id):
#     user = User.objects.get(id=user_id)
#     user_dict = model_to_dict(user)
#     safe_user = omit_module.default(user_dict, 'password', 'secret_token')
#     return JsonResponse(safe_user)

print("Real-world use case:")
print("- Python Flask/Django apps sanitize sensitive data")
print("- Uses same TypeScript implementation as Node.js service")
print("- Guarantees consistent security across entire stack")
print("- No need to install Python omit library")
print()

print("Problem Solved:")
print("Before: Manual dict comprehension = easy to forget sensitive fields")
print("After: One Elide implementation = consistent sanitization")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  omit = require('./elide-omit.ts')")
print("  safe = omit.default(user, 'password', 'salt')  # That's it!")
