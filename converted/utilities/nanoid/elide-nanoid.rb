#!/usr/bin/env ruby

# Ruby Integration Example for elide-nanoid (Compact ID Generator)
#
# Demonstrates calling the TypeScript nanoid implementation from Ruby
# for consistent compact URL-safe IDs across microservices.

puts "=== Ruby Calling TypeScript Nanoid ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# nanoid_module = Elide.require('./elide-nanoid.ts')

# Example 1: Generate compact IDs
# id1 = nanoid_module.nanoid()
# puts "ID 1: #{id1}"  # e.g., "V1StGXR8_Z5jdHi6B-myT"

# Example 2: Custom sizes for URL shortener
# short_code_gen = nanoid_module.customAlphabet(
#   nanoid_module.alphabets[:alphanumeric], 8
# )
# short_code = short_code_gen.call()
# puts "Short code: #{short_code}"  # e.g., "aB3x9K1z"

# Example 3: Rails model with nanoid
# class ShortenedUrl < ApplicationRecord
#   before_create :generate_short_code
#
#   private
#
#   def generate_short_code
#     nanoid = Elide.require('./elide-nanoid.ts')
#     gen = nanoid.customAlphabet(nanoid.alphabets[:alphanumeric], 8)
#     self.short_code = gen.call()
#   end
# end
#
# # Create shortened URL
# url = ShortenedUrl.create(
#   long_url: 'https://example.com/very/long/url'
# )
# puts "Short URL: https://short.ly/#{url.short_code}"

# Example 4: Sidekiq job with unique IDs
# class ProcessJob
#   include Sidekiq::Worker
#
#   def perform(data)
#     nanoid = Elide.require('./elide-nanoid.ts')
#     job_id = nanoid.nanoid(16)
#     logger.info "Processing job: #{job_id}"
#     # Process with unique ID, same format as Node.js!
#   end
# end

# Example 5: Sinatra API
# require 'sinatra'
# NANOID = Elide.require('./elide-nanoid.ts')
#
# get '/api/generate-id' do
#   content_type :json
#   { id: NANOID.nanoid(16) }.to_json
# end
#
# post '/api/short-url' do
#   gen = NANOID.customAlphabet(NANOID.alphabets[:alphanumeric], 8)
#   short_code = gen.call()
#   content_type :json
#   {
#     short_url: "https://short.ly/#{short_code}",
#     short_code: short_code
#   }.to_json
# end

# Example 6: Database IDs (shorter than UUID)
# class User < ApplicationRecord
#   before_create :generate_compact_id
#
#   private
#
#   def generate_compact_id
#     nanoid = Elide.require('./elide-nanoid.ts')
#     self.id = "user_#{nanoid.nanoid(16)}"  # e.g., "user_V1StGXR8_Z5jdHi"
#   end
# end

# Example 7: Session tokens
# class SessionManager
#   def self.create_token
#     nanoid = Elide.require('./elide-nanoid.ts')
#     nanoid.nanoid(32)  # Secure 32-char token
#   end
# end

puts "Real-world use case:"
puts "- Ruby app generates short URL codes"
puts "- Uses same nanoid as Node.js service"
puts "- Guarantees identical ID format across entire platform"
puts ""

puts "Example: URL Shortener Service"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Nanoid (TypeScript)        │"
puts "│   conversions/nanoid/elide-nanoid.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓"
puts "    ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │"
puts "    │  API   │  │  Rails │"
puts "    └────────┘  └────────┘"
puts "     short.ly/aB3x9K1z"
puts "     ✓ Consistent short codes!"
puts ""

puts "Problem Solved:"
puts "Before: Different ID generators = inconsistent formats"
puts "After: One Elide implementation = perfect synchronization"
puts ""

puts "Benefits:"
puts "  ✓ 60% smaller than UUID (21 vs 36 chars)"
puts "  ✓ URL-safe (no special encoding needed)"
puts "  ✓ Collision-resistant"
puts "  ✓ Same format in Node.js, Python, Ruby, Java"
