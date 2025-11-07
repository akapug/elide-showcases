#!/usr/bin/env ruby
# frozen_string_literal: true

puts "=== Ruby Calling TypeScript Omit ==="
puts

# Example: Rails API Sanitization
# omit_module = Elide.require('./elide-omit.ts')
#
# class UsersController < ApplicationController
#   def show
#     user = User.find(params[:id])
#     user_hash = user.as_json
#     safe_user = omit_module.call(:default, user_hash, 'password', 'salt', 'api_secret')
#     render json: safe_user
#   end
# end

# Example: Sidekiq Job Data Sanitization
# class DataProcessorJob
#   include Sidekiq::Job
#
#   def perform(user_data)
#     # Remove sensitive fields before logging
#     safe_data = omit_module.call(:default, user_data, 'password', 'ssn', 'credit_card')
#     logger.info "Processing user: #{safe_data}"
#     process_data(user_data)
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails/Sidekiq apps sanitize sensitive data"
puts "- Uses same TypeScript implementation as Node.js service"
puts "- Guarantees consistent security across entire stack"
puts "- No need to install Ruby gem"
puts

puts "When Elide Ruby API is ready, usage will be:"
puts "  omit_module = Elide.require('./elide-omit.ts')"
puts "  safe = omit_module.call(:default, user, 'password', 'salt')  # That's it!"
