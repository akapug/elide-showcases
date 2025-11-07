#!/usr/bin/env ruby

# Ruby Integration Example for Base64 Codec
#
# This demonstrates calling the TypeScript base64-codec implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One Base64 implementation shared across TypeScript and Ruby
# - URL-safe encoding consistency
# - Unified validation logic

puts "=== Ruby Calling TypeScript Base64 Codec ===\n"

# Assuming Elide provides something like:
# codec = Elide.require('./base64-codec.ts')

# Example 1: Encode string
# text = "Hello, Elide!"
# encoded = codec.encode(text)
# puts "Encoded: #{encoded}"

# Example 2: Decode string
# decoded = codec.decode(encoded)
# puts "Decoded: #{decoded}"

# Example 3: URL-safe encoding
# url_text = "test+data/value="
# url_encoded = codec.encodeURL(url_text)
# puts "URL-safe: #{url_encoded}"

# Example 4: Use in Rails
# class ApiToken
#   def self.encode(payload)
#     codec.encodeURL(payload.to_json)
#   end
# end

puts "Real-world use case:"
puts "- Ruby workers encode job data"
puts "- Uses same TypeScript implementation as Node.js services"
puts "- Guarantees consistent encoding across job queue"
puts ""

puts "Problem Solved:"
puts "Before: Ruby Base64 + JavaScript btoa = different URL-safe encoding"
puts "After: One Elide implementation = consistent encoding everywhere"
