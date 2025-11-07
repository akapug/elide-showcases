#!/usr/bin/env python3
"""
Python Integration Example for elide-cron-parser
"""

# from elide import require
# cron = require('./elide-cron-parser.ts')

print("=== Python Calling TypeScript Cron Parser ===\n")

# Example: Schedule jobs
# next_run = cron.getNextExecution("0 12 * * *")  # Daily at noon
# print(f"Next run: {next_run}")

# Example: Validate cron expressions
# is_valid = cron.isValidExpression("0 */6 * * *")
# print(f"Valid: {is_valid}")

print("Real-world use case:")
print("- Python task scheduler needs cron parsing")
print("- Uses same TypeScript implementation as Node.js")
print("- Guarantees identical scheduling across services")
print()

print("When Elide Python API is ready:")
print("  from elide import require")
print("  cron = require('./elide-cron-parser.ts')")
print("  next = cron.getNextExecution('0 12 * * *')")
