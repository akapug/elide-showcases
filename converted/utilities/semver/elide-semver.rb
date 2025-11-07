#!/usr/bin/env ruby

# Ruby Integration Example for elide-semver
#
# This demonstrates calling the TypeScript semver implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One semver implementation shared across TypeScript and Ruby
# - Consistent parse and compare semantic version numbers across microservices
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript semver ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# semver_module = Elide.require('./elide-semver.ts')

# Example: Basic usage
# result = semver_module.default()
# puts "Result: #{result}"

puts "Real-world use case:"
puts "- Ruby worker uses parse and compare semantic version numbers"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent behavior across services"
puts "- Perfect for version management, dependency resolution, release automation"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide semver (TypeScript)         │"
puts "│   conversions/semver/elide-semver.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same parse and compare semantic version numbers everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby custom + JavaScript = different behaviors"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/semver.rb"
puts "  SEMVER = Elide.require('./elide-semver.ts')"
