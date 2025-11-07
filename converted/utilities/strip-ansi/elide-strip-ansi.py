#!/usr/bin/env python3
"""
Python Integration Example for elide-strip-ansi
"""

# from elide import require
# stripAnsi = require('./elide-strip-ansi.ts')

print("=== Python Calling TypeScript Strip ANSI ===\n")

# Example: Clean log files
# log = "\x1b[32mINFO\x1b[0m Server started"
# clean = stripAnsi.strip(log)
# print(clean)  # "INFO Server started"

# Example: Process terminal output
# def clean_logs(log_lines):
#     return [stripAnsi.strip(line) for line in log_lines]

print("Real-world use case:")
print("- Python log processor needs to clean ANSI codes")
print("- Uses same TypeScript implementation as Node.js")
print("- Consistent text cleaning across services")
print()

print("When Elide Python API is ready:")
print("  from elide import require")
print("  stripAnsi = require('./elide-strip-ansi.ts')")
print("  clean = stripAnsi.strip(colored_text)")
