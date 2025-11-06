#!/usr/bin/env ruby

# Ruby Integration Example for elide-camelcase
# This demonstrates calling the TypeScript camelCase implementation from Ruby.
# Benefits: Consistent API response transformation across TypeScript and Ruby services.

puts "=== Ruby Calling TypeScript camelCase ===\n"

# camel_case = Elide.require('./elide-camelcase.ts')

# Example: Rails API Response
# class Api::UsersController < ApplicationController
#   def show
#     user = User.find(params[:id])
#     # Transform keys to camelCase for JSON API
#     response = transform_keys(user.attributes)
#     render json: response
#   end
#
#   private
#   def transform_keys(hash)
#     hash.transform_keys { |key| camel_case.default(key.to_s) }
#   end
# end

puts "Real-world use cases:"
puts "- Rails API response transformation"
puts "- JSON serialization (snake_case → camelCase)"
puts "- Frontend-backend key normalization"
puts ""

puts "When Elide Ruby API is ready:"
puts "  camel_case = Elide.require('./elide-camelcase.ts')"
puts "  camel_case.default('user_name')  # 'userName'"
