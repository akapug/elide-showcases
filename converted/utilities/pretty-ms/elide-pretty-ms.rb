#!/usr/bin/env ruby

# Ruby Integration Example for elide-pretty-ms
#
# This demonstrates calling the TypeScript pretty-ms implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One pretty-ms implementation shared across TypeScript and Ruby
# - Consistent convert milliseconds to human-readable strings across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript pretty-ms ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# pretty_ms_module = Elide.require('./elide-pretty-ms.ts')

# Example: Basic usage
# result = pretty_ms_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses convert milliseconds to human-readable strings"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for performance metrics, duration formatting, UI display"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide pretty-ms (TypeScript)         │"
puts "│   conversions/pretty-ms/elide-pretty-ms.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same convert milliseconds to human-readable strings everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/pretty_ms.rb"
puts "  PRETTY_MS = Elide.require('./elide-pretty-ms.ts')"
