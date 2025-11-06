#!/usr/bin/env ruby
# frozen_string_literal: true

# Ruby Integration Example for elide-merge-deep
#
# This demonstrates calling the TypeScript merge-deep implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One merge implementation shared across TypeScript and Ruby
# - Consistent deep merging across services
# - No Ruby gem needed
# - Guaranteed format consistency

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# merge_module = Elide.require('./elide-merge-deep.ts')

puts "=== Ruby Calling TypeScript Merge Deep ==="
puts

# Example 1: Rails Configuration
# default_config = {
#   database: {
#     adapter: 'postgresql',
#     host: 'localhost',
#     port: 5432
#   },
#   cache: {
#     store: :memory_store
#   }
# }
#
# env_config = {
#   database: {
#     host: 'db.example.com',
#     database: 'production'
#   }
# }
#
# merged = merge_module.call(:default, default_config, env_config)
# puts "Merged Rails config: #{merged}"
# puts

# Example 2: Sidekiq Job Configuration
# class DataProcessorJob
#   include Sidekiq::Job
#
#   def perform(user_id, options = {})
#     default_options = {
#       retry: true,
#       timeout: 300,
#       callbacks: {
#         on_success: :log_success,
#         on_error: :log_error
#       }
#     }
#
#     # Merge with user options using Elide
#     final_options = merge_module.call(:default, default_options, options)
#
#     process_data(user_id, final_options)
#   end
# end

# Example 3: Deep Hash Merging
# user_settings = {
#   profile: { name: 'Alice', age: 25 },
#   preferences: { theme: 'dark', language: 'en' }
# }
#
# updates = {
#   preferences: { theme: 'light' }
# }
#
# merged_settings = merge_module.call(:default, user_settings, updates)
# puts "Merged settings: #{merged_settings}"
# puts

# Example 4: Array Merge Strategies
# data1 = { tags: ['ruby', 'rails'] }
# data2 = { tags: ['elide', 'polyglot'] }
#
# # Replace strategy (default)
# replaced = merge_module.call(:default, data1, data2)
# puts "Replaced: #{replaced}"
#
# # Concat strategy
# options = { arrayMerge: 'concat' }
# concatenated = merge_module.call(:mergeDeepWith, options, data1, data2)
# puts "Concatenated: #{concatenated}"
#
# # Unique strategy
# options = { arrayMerge: 'unique' }
# unique = merge_module.call(:mergeDeepWith, options, data1, data2)
# puts "Unique: #{unique}"

# Example 5: API Client Configuration
# class ApiClient
#   DEFAULT_CONFIG = {
#     base_url: 'https://api.example.com',
#     timeout: 30,
#     headers: {
#       'Content-Type' => 'application/json'
#     },
#     retry: {
#       max_attempts: 3,
#       backoff: :exponential
#     }
#   }.freeze
#
#   def initialize(custom_config = {})
#     @config = merge_module.call(:default, DEFAULT_CONFIG, custom_config)
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails/Sidekiq apps merge configs"
puts "- Uses same TypeScript implementation as Node.js service"
puts "- Guarantees consistent config format across entire stack"
puts "- No need to install Ruby deep-merge gem"
puts

puts "Example: E-commerce Platform"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Merge-Deep (TypeScript)    │"
puts "│   elide-merge-deep.ts               │"
puts "└─────────────────────────────────────┘"
puts "         ↓                   ↓"
puts "    ┌────────┐          ┌────────┐"
puts "    │ Node.js│          │  Ruby  │"
puts "    │  API   │          │Workers │"
puts "    └────────┘          └────────┘"
puts "         ↓                   ↓"
puts "    Same deep merge logic everywhere!"
puts

puts "Problem Solved:"
puts "Before: Different merge implementations = subtle bugs"
puts "After: One Elide implementation = 100% consistent"
puts

puts "Performance Benefits:"
puts "- Zero cold start overhead with Elide"
puts "- Instant deep merging"
puts "- Shared runtime across languages"
puts "- No Ruby gem installation needed"
puts

puts "When Elide Ruby API is ready, usage will be:"
puts "  merge_module = Elide.require('./elide-merge-deep.ts')"
puts "  result = merge_module.call(:default, obj1, obj2)  # That's it!"
