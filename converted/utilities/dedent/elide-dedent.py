#!/usr/bin/env python3
"""
Python Integration Example for elide-dedent

This demonstrates calling the TypeScript dedent implementation
from Python using Elide's polyglot capabilities.

Benefits:
- One dedent implementation shared across TypeScript and Python
- Consistent string formatting across services
- No Python textwrap.dedent needed
- Perfect for SQL queries, templates, multi-line strings
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# dedent_module = require('./elide-dedent.ts')

print("=== Python Calling TypeScript Dedent ===\n")

# Example 1: SQL Query Formatting
# def get_users_query():
#     query = dedent_module.default("""
#         SELECT id, username, email
#         FROM users
#         WHERE active = true
#         ORDER BY created_at DESC
#     """)
#     return query
#
# query = get_users_query()
# print("SQL Query:")
# print(query)
# print()

# Example 2: Email Templates
# class EmailService:
#     def send_welcome_email(self, username, email):
#         body = dedent_module.default(f"""
#             Hello {username}!
#
#             Welcome to our platform. We're excited to have you.
#
#             Your registered email: {email}
#
#             Best regards,
#             The Team
#         """)
#         # Send email with body
#         return body
#
# email_service = EmailService()
# email = email_service.send_welcome_email("Alice", "alice@example.com")
# print("Email Body:")
# print(email)
# print()

# Example 3: Django Template Rendering
# from django.template import Template, Context
#
# def render_user_profile(user):
#     template_str = dedent_module.default("""
#         <div class="user-profile">
#             <h1>{{ user.username }}</h1>
#             <p>Email: {{ user.email }}</p>
#             <p>Joined: {{ user.created_at }}</p>
#         </div>
#     """)
#     template = Template(template_str)
#     context = Context({'user': user})
#     return template.render(context)

# Example 4: Configuration File Generation
# class ConfigGenerator:
#     def generate_nginx_config(self, domain, port):
#         config = dedent_module.default(f"""
#             server {{
#                 listen 80;
#                 server_name {domain};
#
#                 location / {{
#                     proxy_pass http://localhost:{port};
#                     proxy_set_header Host $host;
#                 }}
#             }}
#         """)
#         return config
#
# generator = ConfigGenerator()
# config = generator.generate_nginx_config("example.com", 3000)
# print("Nginx Config:")
# print(config)
# print()

# Example 5: Docstring Formatting
# class APIClient:
#     def fetch_data(self, endpoint):
#         """
#         Use dedent for clean docstrings
#         """
#         docstring = dedent_module.default("""
#             Fetch data from the API endpoint.
#
#             Args:
#                 endpoint: The API endpoint path
#
#             Returns:
#                 JSON response from the API
#         """)
#         return docstring

print("Real-world use cases:")
print("- SQL query formatting")
print("- Email template generation")
print("- HTML/XML string formatting")
print("- Configuration file generation")
print("- Docstring and comment formatting")
print("- Multi-line string literals")
print()

print("Example: Flask Web Application")
print("┌──────────────────────────────────────┐")
print("│   Elide Dedent (TypeScript)         │")
print("│   elide-dedent.ts                   │")
print("└──────────────────────────────────────┘")
print("         ↓                   ↓")
print("    ┌────────┐          ┌────────┐")
print("    │ Node.js│          │ Python │")
print("    │  API   │          │ Flask  │")
print("    └────────┘          └────────┘")
print("         ↓                   ↓")
print("    Same clean strings everywhere!")
print()

print("Problem Solved:")
print("Before: Python textwrap + JS dedent = different edge cases")
print("After: One Elide implementation = consistent formatting")
print()

print("When Elide Python API is ready, usage will be:")
print("  from elide import require")
print("  dedent = require('./elide-dedent.ts')")
print("  clean_str = dedent.default('''")
print("      Indented text")
print("      More text")
print("  ''')")
