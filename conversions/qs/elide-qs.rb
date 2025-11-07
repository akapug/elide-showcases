#!/usr/bin/env ruby

# Ruby Integration Example for elide-qs
#
# This demonstrates calling the TypeScript qs implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One qs implementation shared across TypeScript and Ruby
# - Consistent parse and stringify url query strings across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript qs ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# qs_module = Elide.require('./elide-qs.ts')

# Example: Basic usage
# result = qs_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses parse and stringify url query strings"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for API query parameters, URL generation, form data parsing"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide qs (TypeScript)         │"
puts "│   conversions/qs/elide-qs.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same parse and stringify url query strings everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/qs.rb"
puts "  QS = Elide.require('./elide-qs.ts')"
