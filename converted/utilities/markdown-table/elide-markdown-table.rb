#!/usr/bin/env ruby

# Ruby Integration Example for elide-markdown-table
#
# This demonstrates calling the TypeScript markdown-table implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One markdown-table implementation shared across TypeScript and Ruby
# - Consistent generate markdown tables from data arrays across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript markdown-table ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# markdown_table_module = Elide.require('./elide-markdown-table.ts')

# Example: Basic usage
# result = markdown_table_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses generate markdown tables from data arrays"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for documentation generation, report formatting, data export"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide markdown-table (TypeScript)         │"
puts "│   conversions/markdown-table/elide-markdown-table.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same generate markdown tables from data arrays everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/markdown_table.rb"
puts "  MARKDOWN_TABLE = Elide.require('./elide-markdown-table.ts')"
