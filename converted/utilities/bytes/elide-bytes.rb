#!/usr/bin/env ruby

# Ruby Integration Example for elide-bytes (Byte Formatter)
#
# Demonstrates calling the TypeScript bytes implementation from Ruby
# for consistent byte formatting across microservices.

puts "=== Ruby Calling TypeScript Bytes ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# bytes_module = Elide.require('./elide-bytes.ts')

# Example 1: Format byte sizes
# file_size = bytes_module.format(1024)
# puts "1024 bytes = #{file_size}"  # "1KB"

# Example 2: Rails file upload limits
# class UploadsController < ApplicationController
#   MAX_UPLOAD_SIZE = Elide.require('./elide-bytes.ts').parse('100MB')
#
#   def create
#     if request.body.size > MAX_UPLOAD_SIZE
#       render json: {
#         error: "File too large. Max: #{bytes_module.format(MAX_UPLOAD_SIZE)}"
#       }, status: 413
#     else
#       # Process upload...
#     end
#   end
# end

# Example 3: Sidekiq storage monitoring
# class StorageMonitorWorker
#   include Sidekiq::Worker
#
#   def perform
#     bytes = Elide.require('./elide-bytes.ts')
#
#     # Get disk usage (same format as Node.js!)
#     stat = Sys::Filesystem.stat("/")
#     total = stat.bytes_total
#     used = stat.bytes_used
#     free = stat.bytes_free
#
#     StorageMetrics.create(
#       total: bytes.format(total),
#       used: bytes.format(used),
#       free: bytes.format(free)
#     )
#   end
# end

# Example 4: Rails configuration
# # config/application.rb
# BYTES = Elide.require('./elide-bytes.ts')
#
# config.active_storage.max_file_size = BYTES.parse('10MB')
# config.action_controller.max_upload_size = BYTES.parse('100MB')

# Example 5: Bandwidth reporting
# require 'net/http'
#
# bytes = Elide.require('./elide-bytes.ts')
#
# response = Net::HTTP.get_response(uri)
# content_length = response['content-length'].to_i
#
# puts "Downloaded: #{bytes.format(content_length)}"
# # Same format as Node.js service!

puts "Real-world use case:"
puts "- Ruby worker monitors storage: disk_used = 1073741824 bytes"
puts "- Uses same bytes formatter as Node.js dashboard"
puts "- Guarantees identical '1GB' display across monitoring stack"
puts ""

puts "Example: Storage Monitoring"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Bytes (TypeScript)         │"
puts "│   conversions/bytes/elide-bytes.ts │"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓"
puts "    ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │"
puts "    │Dashboard│ │ Worker │"
puts "    └────────┘  └────────┘"
puts "     '1GB'        '1GB'"
puts "     = 1073741824 = 1073741824"
puts "     ✓ Consistent formatting!"
puts ""

puts "Problem Solved:"
puts "Before: Different byte formatting = inconsistent displays"
puts "After: One Elide implementation = perfect consistency"
