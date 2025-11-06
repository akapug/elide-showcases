#!/usr/bin/env ruby

# Ruby Integration Example for elide-base64
#
# This demonstrates calling the TypeScript base64 implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One base64 implementation shared across TypeScript and Ruby
# - Consistent encoding/decoding across microservices
# - No Ruby Base64 module needed
# - Perfect for Rails, Sidekiq, API authentication

puts "=== Ruby Calling TypeScript Base64 ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# base64 = Elide.require('./elide-base64.ts')

# Example 1: HTTP Basic Auth
# username = "api_user"
# password = "secret_key_123"
# credentials = "#{username}:#{password}"
# encoded = base64.encode(credentials)
# puts "Basic Auth Header: Basic #{encoded}"
# puts "Decoded: #{base64.decode(encoded)}"
# puts ""

# Example 2: Rails Authentication Controller
# class AuthController < ApplicationController
#   def basic_auth
#     auth_header = request.headers['Authorization']
#     if auth_header&.start_with?('Basic ')
#       encoded = auth_header.split(' ')[1]
#       credentials = base64.decode(encoded)
#       username, password = credentials.split(':')
#
#       # Authenticate user with consistent base64 decoding
#       user = User.find_by(username: username)
#       if user&.authenticate(password)
#         render json: { token: generate_jwt(user) }
#       else
#         render json: { error: 'Invalid credentials' }, status: 401
#       end
#     end
#   end
#
#   private
#   def generate_jwt(user)
#     payload = { user_id: user.id, exp: Time.now.to_i + 3600 }
#     jwt_payload = JSON.generate(payload)
#     base64.encode(jwt_payload, url_safe: true)
#   end
# end

# Example 3: Sidekiq Job with Token Encoding
# class TokenGeneratorJob
#   include Sidekiq::Worker
#
#   def perform(user_id)
#     # Generate API token using same base64 as Node.js API
#     token_data = {
#       user_id: user_id,
#       issued_at: Time.now.to_i,
#       nonce: SecureRandom.hex(16)
#     }.to_json
#
#     token = base64.encode(token_data, url_safe: true)
#
#     # Store token in Redis
#     redis.setex("api_token:#{user_id}", 3600, token)
#
#     puts "Generated token for user #{user_id}: #{token[0..20]}..."
#   end
# end

# Example 4: Data URL Generation for Images
# class ImageUploader
#   def self.to_data_url(file_path)
#     # Read file as binary
#     data = File.binread(file_path)
#
#     # Detect MIME type
#     mime_type = case File.extname(file_path).downcase
#                 when '.png' then 'image/png'
#                 when '.jpg', '.jpeg' then 'image/jpeg'
#                 when '.gif' then 'image/gif'
#                 else 'application/octet-stream'
#                 end
#
#     # Encode to base64
#     encoded = base64.encode(data)
#     "data:#{mime_type};base64,#{encoded}"
#   end
# end
#
# data_url = ImageUploader.to_data_url('avatar.png')
# puts "Data URL: #{data_url[0..80]}..."
# puts ""

# Example 5: API Token Service (Rails)
# class ApiTokenService
#   def self.generate(user_id, scope)
#     token_data = "#{user_id}:#{Time.now.to_i}:#{scope}"
#     base64.encode(token_data, url_safe: true)
#   end
#
#   def self.validate(token)
#     decoded = base64.decode(token, url_safe: true)
#     user_id, timestamp, scope = decoded.split(':')
#
#     # Check expiration (24 hours)
#     return false if Time.now.to_i - timestamp.to_i > 86400
#
#     { user_id: user_id, scope: scope }
#   rescue => e
#     false
#   end
# end
#
# token = ApiTokenService.generate(123, 'read:write')
# puts "Generated Token: #{token}"
# validation = ApiTokenService.validate(token)
# puts "Token Valid: #{validation}"
# puts ""

puts "Real-world use case:"
puts "- Ruby Rails API encodes/decodes authentication headers"
puts "- Sidekiq workers generate base64-encoded tokens"
puts "- Uses same TypeScript implementation as Node.js gateway"
puts "- Guarantees consistent encoding across all services"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Base64 (TypeScript)        │"
puts "│   conversions/base64/elide-base64  │"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  Auth  │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same token encoding everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby Base64 + JavaScript Buffer = potential padding issues"
puts "After: One Elide implementation = 100% consistent tokens"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/base64.rb"
puts "  BASE64 = Elide.require('./elide-base64.ts')"
puts "  "
puts "  # app/controllers/auth_controller.rb"
puts "  class AuthController < ApplicationController"
puts "    def basic_auth"
puts "      encoded = request.headers['Authorization'].split(' ')[1]"
puts "      credentials = BASE64.decode(encoded)"
puts "    end"
puts "  end"
puts ""

puts "Sidekiq Integration (when ready):"
puts "  class TokenJob"
puts "    include Sidekiq::Worker"
puts "    "
puts "    def perform(user_id)"
puts "      token = BASE64.encode(generate_token_data(user_id))"
puts "      # Store or send token"
puts "    end"
puts "  end"
