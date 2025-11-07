#!/usr/bin/env ruby

# Ruby Integration Example for elide-p-limit
#
# This demonstrates calling the TypeScript p-limit implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One p-limit implementation shared across TypeScript and Ruby
# - Consistent concurrency limiting behavior across microservices
# - No Ruby library discrepancies
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript PLimit ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# p-limit_module = Elide.require('./elide-p-limit.ts')

# Example 1: Basic Usage
# result = p-limit_module.default(input_data)
# puts "Result: #{result}"
# puts ""

# Example 2: Rails Integration
# class DataService
#   def initialize
#     @p-limit = p-limit_module
#   end
#
#   def process(data)
#     @p-limit.default(data)
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
#     result = p-limit_module.default(data)
#     puts "Job result: #{result}"
#   end
# end

puts "Real-world use case:"
puts "- Ruby worker uses p-limit"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent concurrency limiting across services"
puts "- Rate limit API calls"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────────┐"
puts "│   Elide PLimit (TypeScript)           │"
puts "│   elide-p-limit.ts                        │"
puts "└─────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same concurrency limiting everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby + JavaScript = different implementations"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/p-limit.rb"
puts "  P_LIMIT = Elide.require('./elide-p-limit.ts')"
puts "  "
puts "  # app/services/data_service.rb"
puts "  class DataService"
puts "    def process(data)"
puts "      P_LIMIT.default(data)"
puts "    end"
puts "  end"
