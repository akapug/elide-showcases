#!/usr/bin/env ruby

# Ruby Integration Example for elide-reverse-string
#
# This demonstrates calling the TypeScript reverse-string implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One reverse-string implementation shared across TypeScript and Ruby
# - Consistent reverse a string across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript reverse-string ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# reverse_string_module = Elide.require('./elide-reverse-string.ts')

# Example: Basic usage
# result = reverse_string_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses reverse a string"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for text manipulation, palindrome checking, data reversal"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide reverse-string (TypeScript)         │"
puts "│   conversions/reverse-string/elide-reverse-string.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same reverse a string everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/reverse_string.rb"
puts "  REVERSE_STRING = Elide.require('./elide-reverse-string.ts')"
