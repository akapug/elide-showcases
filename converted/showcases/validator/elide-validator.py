#!/usr/bin/env python3
"""
Python Integration Example for elide-validator

This demonstrates calling the TypeScript validator implementation from Python
using Elide's polyglot capabilities.

Benefits:
- One validation implementation shared across TypeScript and Python
- Consistent validation rules across frontend and backend
- No Python validator library needed
- Guaranteed format consistency for emails, URLs, IPs, credit cards
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# validator = require('./elide-validator.ts')

print("=== Python Calling TypeScript Validator ===\n")

# Example 1: Email Validation in API
# def validate_user_registration(email, password):
#     if not validator.isEmail(email):
#         return {"error": "Invalid email address"}
#
#     if not validator.isLength(password, {"min": 8, "max": 128}):
#         return {"error": "Password must be 8-128 characters"}
#
#     normalized_email = validator.normalizeEmail(email)
#     return {"email": normalized_email, "valid": True}
#
# result = validate_user_registration("user.name+tag@gmail.com", "password123")
# print(f"Registration validation: {result}")
# print()

# Example 2: API Input Validation
# @app.route('/api/users', methods=['POST'])
# def create_user():
#     data = request.json
#
#     # Validate email
#     if not validator.isEmail(data.get('email', '')):
#         return jsonify({"error": "Invalid email"}), 400
#
#     # Validate URL
#     if not validator.isURL(data.get('website', ''), {"requireProtocol": True}):
#         return jsonify({"error": "Invalid website URL"}), 400
#
#     # Validate phone
#     if not validator.isMobilePhone(data.get('phone', '')):
#         return jsonify({"error": "Invalid phone number"}), 400
#
#     return jsonify({"success": True}), 201

# Example 3: Data Pipeline Validation
# def process_payment_records(records):
#     validated = []
#     errors = []
#
#     for record in records:
#         # Validate credit card
#         card = record.get('card_number', '')
#         if not validator.isCreditCard(card):
#             errors.append(f"Invalid card: {record['id']}")
#             continue
#
#         # Validate email
#         email = record.get('email', '')
#         if not validator.isEmail(email):
#             errors.append(f"Invalid email: {record['id']}")
#             continue
#
#         # Escape HTML for safe storage
#         record['notes'] = validator.escape(record.get('notes', ''))
#         validated.append(record)
#
#     return validated, errors
#
# sample_records = [
#     {"id": 1, "card_number": "4532015112830366", "email": "user@example.com", "notes": "<b>VIP</b>"},
#     {"id": 2, "card_number": "1234567890123456", "email": "invalid", "notes": "Regular"}
# ]
# valid, errs = process_payment_records(sample_records)
# print(f"Validated {len(valid)} records, {len(errs)} errors")
# print()

# Example 4: IP Address Validation for Security
# def validate_ip_whitelist(ip_address, whitelist):
#     if not validator.isIP(ip_address, 4):
#         return False
#
#     # Check if IP is in whitelist
#     return validator.isIn(ip_address, whitelist)
#
# whitelisted = ["192.168.1.1", "10.0.0.1"]
# test_ips = ["192.168.1.1", "256.1.1.1", "10.0.0.1"]
# for ip in test_ips:
#     print(f"IP {ip}: {validate_ip_whitelist(ip, whitelisted)}")
# print()

print("Real-world use case:")
print("- Python Flask/Django API validates user input")
print("- Uses same TypeScript implementation as React frontend")
print("- Guarantees consistent validation rules across stack")
print("- Prevents XSS/injection with unified HTML escaping")
print()

print("Example: Full-Stack Validation")
print("┌─────────────────────────────────────┐")
print("│   Elide Validator (TypeScript)     │")
print("│   conversions/validator/            │")
print("│   elide-validator.ts                │")
print("└─────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ React  │          │ Python │")
print("    │Frontend│          │Backend │")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same validation rules everywhere!")
print()

print("Problem Solved:")
print("Before: Frontend (validator.js) + Backend (custom validators) = inconsistent rules")
print("After: One Elide implementation = 100% consistent validation")
print()

print("Security Benefits:")
print("- Unified XSS prevention with escape()")
print("- Consistent email/URL validation prevents injection")
print("- Credit card validation with Luhn algorithm")
print("- No validation discrepancies between frontend/backend")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  validator = require('./elide-validator.ts')")
print("  ")
print("  # Validate email")
print("  if validator.isEmail(email):")
print("      print('Valid email!')")
print("  ")
print("  # Escape HTML")
print("  safe_html = validator.escape(user_input)")
print()
