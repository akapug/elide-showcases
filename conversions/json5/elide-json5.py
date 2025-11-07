#!/usr/bin/env python3
"""
Python Integration Example for elide-json5

This demonstrates calling the TypeScript JSON5 parser
from Python using Elide's polyglot capabilities.

Benefits:
- One JSON5 parser shared across TypeScript and Python
- Consistent config file parsing across services
- Support for comments and trailing commas in configs
- Perfect for configuration management, data exchange
"""

# NOTE: Exact syntax depends on Elide's Python polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Python support is ready

# Assuming Elide provides something like:
# from elide import require
# json5_module = require('./elide-json5.ts')

print("=== Python Calling TypeScript JSON5 Parser ===\n")

# Example 1: Parse Configuration File with Comments
# def load_config(filename):
#     """Load JSON5 config file with comments"""
#     with open(filename, 'r') as f:
#         content = f.read()
#     return json5_module.parse(content)
#
# # config.json5:
# # {
# #   // Server configuration
# #   "host": "localhost",
# #   "port": 8080,
# #   "debug": true,  // Enable debug mode
# # }
#
# config = load_config('config.json5')
# print(f"Config loaded: {config}")
# print()

# Example 2: Parse API Response with Trailing Commas
# class APIClient:
#     def parse_response(self, json5_text):
#         """Parse JSON5 API response"""
#         return json5_module.parse(json5_text)
#
# client = APIClient()
# response = """{
#     "users": [
#         {"name": "Alice", "age": 30},
#         {"name": "Bob", "age": 25},
#     ],
# }"""
#
# data = client.parse_response(response)
# print(f"Parsed response: {data}")
# print()

# Example 3: Configuration Manager
# class ConfigManager:
#     def __init__(self, config_path):
#         self.config_path = config_path
#         self.config = self.load()
#
#     def load(self):
#         """Load JSON5 configuration"""
#         with open(self.config_path, 'r') as f:
#             return json5_module.parse(f.read())
#
#     def get(self, key, default=None):
#         """Get configuration value"""
#         return self.config.get(key, default)
#
# config_mgr = ConfigManager('app.json5')
# print(f"Database host: {config_mgr.get('database', {}).get('host')}")
# print()

# Example 4: Parse Multi-line Strings
# def parse_description(json5_text):
#     """Parse JSON5 with multi-line strings"""
#     return json5_module.parse(json5_text)
#
# doc = """{
#     title: "My Project",
#     description: 'This is a
#     multi-line
#     description'
# }"""
#
# parsed = parse_description(doc)
# print(f"Parsed document: {parsed}")
# print()

# Example 5: Parse with Unquoted Keys
# class SettingsLoader:
#     @staticmethod
#     def load_settings(json5_text):
#         """Load settings from JSON5 with unquoted keys"""
#         return json5_module.parse(json5_text)
#
# settings_text = """{
#     appName: "MyApp",
#     version: "1.0.0",
#     features: {
#         darkMode: true,
#         notifications: false,
#     }
# }"""
#
# settings = SettingsLoader.load_settings(settings_text)
# print(f"App settings: {settings}")
# print()

# Example 6: Custom Reviver Function
# def parse_with_dates(json5_text):
#     """Parse JSON5 and convert date strings to datetime objects"""
#     def reviver(key, value):
#         # Convert ISO date strings to datetime
#         if isinstance(value, str) and value.startswith('20') and 'T' in value:
#             from datetime import datetime
#             return datetime.fromisoformat(value.replace('Z', '+00:00'))
#         return value
#
#     return json5_module.parse(json5_text, {'reviver': reviver})
#
# data_text = """{
#     event: "Conference",
#     date: "2024-12-15T10:00:00Z",
# }"""
#
# event = parse_with_dates(data_text)
# print(f"Event data: {event}")

print("""
USE CASES FOR JSON5 IN PYTHON:
===============================
1. Configuration Files - Parse configs with comments
2. API Responses - Handle JSON5 from external APIs
3. Data Exchange - Share config between TS and Python services
4. Settings Management - Load app settings with comments
5. Build Configs - Parse build configuration files
6. Environment Configs - Per-environment settings with docs
7. Feature Flags - Config-driven feature toggles
8. Schema Definitions - API schemas with inline documentation

PERFORMANCE BENEFITS:
====================
- Elide's JIT compilation makes parsing extremely fast
- Shared parser across languages reduces code duplication
- Consistent behavior prevents parsing bugs
- Single source of truth for JSON5 parsing
- Native performance comparable to pure Python parsers
""")
