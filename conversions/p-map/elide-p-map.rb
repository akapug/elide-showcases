#!/usr/bin/env ruby

# Ruby Integration Example for elide-p-map
#
# This demonstrates calling the TypeScript p-map implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One p-map implementation shared across TypeScript and Ruby
# - Consistent concurrent mapping behavior across microservices
# - No Ruby library discrepancies
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript PMap ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# p-map_module = Elide.require('./elide-p-map.ts')

# Example 1: Basic Usage
# result = p-map_module.default(input_data)
# puts "Result: #{result}"
# puts ""

# Example 2: Rails Integration
# class DataService
#   def initialize
#     @p-map = p-map_module
#   end
#
#   def process(data)
#     @p-map.default(data)
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
#     result = p-map_module.default(data)
#     puts "Job result: #{result}"
#   end
# end

puts "Real-world use case:"
puts "- Ruby worker uses p-map"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent concurrent mapping across services"
puts "- Process arrays concurrently"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────────┐"
puts "│   Elide PMap (TypeScript)           │"
puts "│   elide-p-map.ts                        │"
puts "└─────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same concurrent mapping everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby + JavaScript = different implementations"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/p-map.rb"
puts "  P_MAP = Elide.require('./elide-p-map.ts')"
puts "  "
puts "  # app/services/data_service.rb"
puts "  class DataService"
puts "    def process(data)"
puts "      P_MAP.default(data)"
puts "    end"
puts "  end"
