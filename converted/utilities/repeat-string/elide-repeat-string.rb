#!/usr/bin/env ruby

# Ruby Integration Example for elide-repeat-string
#
# This demonstrates calling the TypeScript repeat-string implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One repeat-string implementation shared across TypeScript and Ruby
# - Consistent repeat a string n times efficiently across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript repeat-string ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# repeat_string_module = Elide.require('./elide-repeat-string.ts')

# Example: Basic usage
# result = repeat_string_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses repeat a string n times efficiently"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for text formatting, padding, ASCII art, UI borders"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide repeat-string (TypeScript)         │"
puts "│   conversions/repeat-string/elide-repeat-string.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same repeat a string n times efficiently everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/repeat_string.rb"
puts "  REPEAT_STRING = Elide.require('./elide-repeat-string.ts')"
