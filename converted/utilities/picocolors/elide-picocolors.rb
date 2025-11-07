#!/usr/bin/env ruby

# Ruby Integration Example for elide-picocolors
#
# This demonstrates calling the TypeScript picocolors implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One picocolors implementation shared across TypeScript and Ruby
# - Consistent terminal coloring behavior across microservices
# - No Ruby library discrepancies
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript Picocolors ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# picocolors_module = Elide.require('./elide-picocolors.ts')

# Example 1: Basic Usage
# result = picocolors_module.default(input_data)
# puts "Result: #{result}"
# puts ""

# Example 2: Rails Integration
# class DataService
#   def initialize
#     @picocolors = picocolors_module
#   end
#
#   def process(data)
#     @picocolors.default(data)
#   end
# end
#
# service = DataService.new
# result = service.process(input_data)
# puts "Processed: #{result}"
# puts ""

# Example 3: Sidekiq Worker
# class ProcessingJob
#   include Sidekiq::Worker
#
#   def perform(data)
#     result = picocolors_module.default(data)
#     puts "Job result: #{result}"
#   end
# end

puts "Real-world use case:"
puts "- Ruby worker uses picocolors"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent terminal coloring across services"
puts "- Colorize CLI output"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────────┐"
puts "│   Elide Picocolors (TypeScript)           │"
puts "│   elide-picocolors.ts                        │"
puts "└─────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same terminal coloring everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby + JavaScript = different implementations"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/picocolors.rb"
puts "  PICOCOLORS = Elide.require('./elide-picocolors.ts')"
puts "  "
puts "  # app/services/data_service.rb"
puts "  class DataService"
puts "    def process(data)"
puts "      PICOCOLORS.default(data)"
puts "    end"
puts "  end"
