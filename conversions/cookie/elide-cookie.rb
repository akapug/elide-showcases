#!/usr/bin/env ruby

# Ruby Integration Example for elide-cookie
#
# This demonstrates calling the TypeScript cookie implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One cookie parser shared across TypeScript and Ruby
# - Consistent cookie handling across microservices
# - No Ruby cookie gem needed
# - Perfect for Rails, Sinatra, background workers

puts "=== Ruby Calling TypeScript Cookie Parser ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# cookie_module = Elide.require('./elide-cookie.ts')

# Example 1: Parse Cookie Header
# cookie_header = "session=abc123; user=john; theme=dark"
# parsed = cookie_module.parse(cookie_header)
# puts "Cookie header: #{cookie_header}"
# puts "Parsed: #{parsed.inspect}"
# puts ""

# Example 2: Serialize Cookie
# cookie_str = cookie_module.serialize('session', 'abc123', {
#   path: '/',
#   httpOnly: true,
#   secure: true,
#   maxAge: 3600
# })
# puts "Set-Cookie: #{cookie_str}"
# puts ""

# Example 3: Rails Integration
# class ApplicationController < ActionController::Base
#   before_action :parse_custom_cookies
#
#   private
#   def parse_custom_cookies
#     cookie_header = request.headers['Cookie']
#     @custom_cookies = cookie_module.parse(cookie_header) if cookie_header
#   end
#
#   def set_auth_cookie(token)
#     cookie_str = cookie_module.serialize('auth_token', token, {
#       httpOnly: true,
#       secure: Rails.env.production?,
#       sameSite: 'Strict',
#       maxAge: 86400  # 24 hours
#     })
#     response.headers['Set-Cookie'] = cookie_str
#   end
# end

# Example 4: Sinatra Integration
# require 'sinatra'
#
# get '/login' do
#   # Parse incoming cookies
#   cookies = cookie_module.parse(request.env['HTTP_COOKIE'] || '')
#
#   # Create auth cookie
#   auth_cookie = cookie_module.serialize('auth_token', 'jwt_token_here', {
#     httpOnly: true,
#     secure: true,
#     sameSite: 'Strict',
#     maxAge: 86400
#   })
#
#   headers 'Set-Cookie' => auth_cookie
#   'Logged in'
# end

# Example 5: Sidekiq Background Worker
# class SessionCleanupWorker
#   include Sidekiq::Worker
#
#   def perform(cookie_header)
#     # Parse session cookie in background job
#     cookies = cookie_module.parse(cookie_header)
#     session_id = cookies['session']
#
#     # Clean up expired session
#     Session.cleanup(session_id) if session_id
#   end
# end

# Example 6: Cookie Validation
# def validate_auth_cookie(cookie_header)
#   cookies = cookie_module.parse(cookie_header)
#   auth_token = cookies['auth_token']
#
#   return false unless auth_token
#
#   # Verify token
#   verify_jwt_token(auth_token)
# end

puts "Real-world use case:"
puts "- Ruby Rails/Sinatra app parses cookies for auth"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent cookie format across job queue"
puts "- No need for Ruby cookie gems"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Cookie (TypeScript)        │"
puts "│   conversions/cookie/elide-cookie.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same cookie format everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby CGI::Cookie + JavaScript cookie = different formats"
puts "After: One Elide implementation = 100% consistent cookies"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/cookie.rb"
puts "  COOKIE = Elide.require('./elide-cookie.ts')"
puts "  "
puts "  # app/controllers/application_controller.rb"
puts "  class ApplicationController < ActionController::Base"
puts "    def parse_cookies"
puts "      COOKIE.parse(request.headers['Cookie'])"
puts "    end"
puts "  end"
puts ""

puts "Sidekiq Integration (when ready):"
puts "  class MyWorker"
puts "    include Sidekiq::Worker"
puts "    "
puts "    def perform(cookie_header)"
puts "      cookies = COOKIE.parse(cookie_header)"
puts "      # Process with consistent cookie parsing"
puts "    end"
puts "  end"
