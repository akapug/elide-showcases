#!/usr/bin/env ruby

# Ruby Integration Example for elide-ms (Time Duration Parser)
#
# Demonstrates calling the TypeScript ms implementation from Ruby
# for consistent time duration handling across microservices.

puts "=== Ruby Calling TypeScript MS ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# ms_module = Elide.require('./elide-ms.ts')

# Example 1: Parse time strings
# timeout_ms = ms_module.parse('2h')
# puts "2h' = #{timeout_ms}ms"  # 7200000

# Example 2: Sidekiq job delays
# class EmailWorker
#   include Sidekiq::Worker
#
#   def perform(user_id)
#     # Schedule retry with same format as Node.js
#     retry_delay = ms_module.parse('5m')
#     self.class.perform_in(retry_delay / 1000, user_id)
#   end
# end

# Example 3: Rails config
# # config/application.rb
# MS = Elide.require('./elide-ms.ts')
#
# config.session_store :cookie_store,
#   expire_after: MS.parse('7d') / 1000  # Same as Node.js!
#
# config.cache_store :redis_cache_store,
#   expires_in: MS.parse('1h') / 1000

# Example 4: Timeout configuration
# require 'timeout'
#
# api_timeout = ms_module.parse('30s') / 1000  # Convert to seconds
# begin
#   Timeout.timeout(api_timeout) do
#     # API call with consistent timeout
#     RestClient.get('https://api.example.com/data')
#   end
# rescue Timeout::Error
#   puts "Request timed out after #{ms_module.format(api_timeout * 1000)}"
# end

puts "Real-world use case:"
puts "- Ruby worker reads config: delay = '5m'"
puts "- Uses same ms parser as Node.js API"
puts "- Guarantees identical delay values across job queue"
puts ""

puts "Example: Job Scheduling"
puts "┌─────────────────────────────────────┐"
puts "│   Elide MS (TypeScript)            │"
puts "│   conversions/ms/elide-ms.ts       │"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓"
puts "    ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │"
puts "    │  API   │  │ Sidekiq│"
puts "    └────────┘  └────────┘"
puts "     delay: '5m'   delay: '5m'"
puts "     = 300000ms    = 300000ms"
puts "     ✓ Consistent delays!"
puts ""

puts "Problem Solved:"
puts "Before: Different time parsing = inconsistent delays"
puts "After: One Elide implementation = perfect synchronization"
