#!/usr/bin/env ruby

# Ruby Integration Example for elide-tiny-invariant
#
# This demonstrates calling the TypeScript tiny-invariant implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One tiny-invariant implementation shared across TypeScript and Ruby
# - Consistent tiny assertion library for invariant checks across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript tiny-invariant ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# tiny_invariant_module = Elide.require('./elide-tiny-invariant.ts')

# Example: Basic usage
# result = tiny_invariant_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses tiny assertion library for invariant checks"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for error handling, preconditions, contract validation"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide tiny-invariant (TypeScript)         │"
puts "│   conversions/tiny-invariant/elide-tiny-invariant.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same tiny assertion library for invariant checks everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/tiny_invariant.rb"
puts "  TINY_INVARIANT = Elide.require('./elide-tiny-invariant.ts')"
