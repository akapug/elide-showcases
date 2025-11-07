#!/usr/bin/env ruby

# Ruby Integration Example for elide-base64
#
# This demonstrates calling the TypeScript base64 implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One base64 implementation shared across TypeScript and Ruby
# - Consistent base64 encoding behavior across microservices
# - No Ruby library discrepancies
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript Base64 ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# base64_module = Elide.require('./elide-base64.ts')

# Example 1: Basic Usage
# result = base64_module.default(input_data)
# puts "Result: #{result}"
# puts ""

# Example 2: Rails Integration
# class DataService
#   def initialize
#     @base64 = base64_module
#   end
#
#   def process(data)
#     @base64.default(data)
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
#     result = base64_module.default(data)
#     puts "Job result: #{result}"
#   end
# end

puts "Real-world use case:"
puts "- Ruby worker uses base64"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent base64 encoding across services"
puts "- Encode binary data for APIs"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────────┐"
puts "│   Elide Base64 (TypeScript)           │"
puts "│   elide-base64.ts                        │"
puts "└─────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same base64 encoding everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby + JavaScript = different implementations"
puts "After: One Elide implementation = 100% consistent"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/base64.rb"
puts "  BASE64 = Elide.require('./elide-base64.ts')"
puts "  "
puts "  # app/services/data_service.rb"
puts "  class DataService"
puts "    def process(data)"
puts "      BASE64.default(data)"
puts "    end"
puts "  end"
