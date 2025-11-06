#!/usr/bin/env ruby

# Ruby Integration Example for elide-shallow-clone
#
# This demonstrates calling the TypeScript shallow-clone implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One shallow-clone implementation shared across TypeScript and Ruby
# - Consistent create a shallow copy of objects or arrays across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript shallow-clone ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# shallow_clone_module = Elide.require('./elide-shallow-clone.ts')

# Example: Basic usage
# result = shallow_clone_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses create a shallow copy of objects or arrays"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for state management, immutability, object copying"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide shallow-clone (TypeScript)         │"
puts "│   conversions/shallow-clone/elide-shallow-clone.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same create a shallow copy of objects or arrays everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/shallow_clone.rb"
puts "  SHALLOW_CLONE = Elide.require('./elide-shallow-clone.ts')"
