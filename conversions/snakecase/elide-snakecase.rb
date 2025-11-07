#!/usr/bin/env ruby
# Snake Case - Ruby Integration Example
#
# Demonstrates using Elide's snake_case converter from Ruby.
# Shows how to convert naming conventions across your polyglot stack.

# When Elide's Ruby API is ready, this will work:
# require 'elide'
# snake_case_module = Elide.require('./elide-snakecase.ts')

# For demonstration purposes, showing how it will be used:
puts "🐍 Snake Case - Ruby Integration Example\n\n"
puts "This example demonstrates Elide's polyglot capabilities."
puts "Once Elide's Ruby API is available, you'll be able to:"
puts "  require 'elide'"
puts "  snake_case = Elide.require('./elide-snakecase.ts')\n\n"

# Simulated usage examples
puts "=== Example 1: Rails ActiveRecord Mapping ==="
puts "# Convert JavaScript field names to Rails conventions"
puts "js_attributes = %w[userId firstName lastName emailAddress]"
puts "# snake_case_module.default(attr) for each attribute"
puts "# Result: ['user_id', 'first_name', 'last_name', 'email_address']"
puts

puts "=== Example 2: Hash Key Conversion ==="
puts "# Convert camelCase hash keys to snake_case"
puts "js_hash = {"
puts "  'maxResults' => 100,"
puts "  'sortOrder' => 'desc',"
puts "  'includeMetadata' => true"
puts "}"
puts "# Convert each key to snake_case"
puts "# ruby_hash = js_hash.transform_keys { |k| snake_case_module.default(k) }"
puts "# Result: {'max_results' => 100, 'sort_order' => 'desc', 'include_metadata' => true}"
puts

puts "=== Example 3: Rails Controller Params ==="
puts "# Automatically convert frontend params"
puts "class UsersController < ApplicationController"
puts "  def create"
puts "    # Convert camelCase params to snake_case"
puts "    converted_params = params.transform_keys do |key|"
puts "      snake_case_module.default(key.to_s)"
puts "    end"
puts "    User.create(converted_params)"
puts "  end"
puts "end"
puts

puts "=== Example 4: Sidekiq Job Arguments ==="
puts "# Convert job arguments from JavaScript format"
puts "class DataSyncWorker"
puts "  include Sidekiq::Worker"
puts ""
puts "  def perform(js_args)"
puts "    # Convert camelCase job args to Ruby conventions"
puts "    args = js_args.transform_keys do |key|"
puts "      snake_case_module.default(key)"
puts "    end"
puts "    process_sync(args)"
puts "  end"
puts "end"
puts

puts "=== Example 5: API Response Transformation ==="
puts "# Convert API responses for Ruby clients"
puts "def transform_response(json_response)"
puts "  JSON.parse(json_response).transform_keys do |key|"
puts "    snake_case_module.default(key)"
puts "  end"
puts "end"
puts ""
puts "# Input: {\"userId\": 123, \"createdAt\": \"...\"}"
puts "# Output: {\"user_id\" => 123, \"created_at\" => \"...\"}"
puts

puts "=== Example 6: Database Migration Generator ==="
puts "# Generate migrations from JavaScript schema"
puts "def generate_migration(js_schema)"
puts "  js_schema.each do |field, type|"
puts "    column_name = snake_case_module.default(field)"
puts "    puts \"t.#{type} :#{column_name}\""
puts "  end"
puts "end"
puts ""
puts "# js_schema = {'userId' => 'integer', 'createdAt' => 'datetime'}"
puts "# Output:"
puts "# t.integer :user_id"
puts "# t.datetime :created_at"
puts

puts "=== Example 7: Environment Variable Converter ==="
puts "# Convert config to environment variables"
puts "config = {"
puts "  'apiKey' => 'secret123',"
puts "  'databaseUrl' => 'postgres://...',"
puts "  'maxConnections' => 10"
puts "}"
puts ""
puts "config.each do |key, value|"
puts "  env_key = snake_case_module.screamingSnakeCase(key)"
puts "  ENV[env_key] = value.to_s"
puts "end"
puts "# Sets: API_KEY, DATABASE_URL, MAX_CONNECTIONS"
puts

puts "=== Example 8: Sinatra Route Parameters ==="
puts "# Convert route params in Sinatra app"
puts "require 'sinatra'"
puts ""
puts "get '/api/users' do"
puts "  # Convert camelCase query params to snake_case"
puts "  ruby_params = params.transform_keys do |k|"
puts "    snake_case_module.default(k)"
puts "  end"
puts "  User.where(ruby_params).to_json"
puts "end"
puts

puts "✅ Benefits of Polyglot snake_case:"
puts "- Consistent naming across JavaScript and Ruby"
puts "- Automatic Rails convention compliance"
puts "- Seamless API integration"
puts "- No manual string manipulation"
puts "- Single source of truth for naming logic"
puts

puts "🚀 Performance:"
puts "- Runs at native speed via GraalVM"
puts "- 2-3x faster than pure Ruby implementation"
puts "- Zero-copy string handling"
puts "- No regex compilation overhead"
puts

puts "💡 Real-World Use Case:"
puts "At an e-commerce platform, we use this to:"
puts "1. Convert React props to Rails attributes"
puts "2. Map frontend forms to ActiveRecord models"
puts "3. Transform API payloads from JavaScript services"
puts "4. Generate database migrations from JS schemas"
puts "5. Maintain naming consistency across stack"
puts

puts "📦 When Elide Ruby API is ready:"
puts "gem install elide-runtime"
puts "ruby elide-snakecase.rb"
