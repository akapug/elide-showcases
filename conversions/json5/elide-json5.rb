#!/usr/bin/env ruby
# frozen_string_literal: true

=begin
Ruby Integration Example for elide-json5

This demonstrates calling the TypeScript JSON5 parser
from Ruby using Elide's polyglot capabilities.

Benefits:
- One JSON5 parser shared across TypeScript and Ruby
- Consistent config file parsing across services
- Support for comments and trailing commas
- Perfect for Rails apps, configuration management
=end

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# require 'elide'
# Json5Module = Elide.require('./elide-json5.ts')

puts "=== Ruby Calling TypeScript JSON5 Parser ==="
puts

# Example 1: Rails Configuration Loader
# class ConfigLoader
#   def self.load_json5(filepath)
#     content = File.read(filepath)
#     Json5Module.parse(content)
#   end
#
#   def self.load_database_config
#     # database.json5:
#     # {
#     #   development: {
#     #     host: "localhost",
#     #     port: 5432,  // PostgreSQL
#     #     database: "myapp_dev",
#     #   }
#     # }
#     load_json5('config/database.json5')
#   end
# end
#
# puts "Database Config:"
# config = ConfigLoader.load_database_config
# puts config.inspect
# puts

# Example 2: API Client with JSON5 Responses
# class APIClient
#   def initialize(base_url)
#     @base_url = base_url
#   end
#
#   def parse_json5_response(response_text)
#     Json5Module.parse(response_text)
#   end
#
#   def fetch_config
#     # Simulated API response with JSON5
#     response = <<~JSON5
#       {
#         // API Configuration
#         "endpoint": "/api/v1",
#         "timeout": 30,
#         "retries": 3,
#       }
#     JSON5
#
#     parse_json5_response(response)
#   end
# end
#
# client = APIClient.new("https://api.example.com")
# puts "API Config:"
# puts client.fetch_config.inspect
# puts

# Example 3: Feature Flag Manager
# class FeatureFlagManager
#   attr_reader :flags
#
#   def initialize(config_path)
#     @config_path = config_path
#     @flags = load_flags
#   end
#
#   def load_flags
#     # features.json5:
#     # {
#     #   darkMode: true,          // Enable dark mode
#     #   betaFeatures: false,     // Beta features disabled
#     #   analytics: true,         // Track analytics
#     # }
#     content = File.read(@config_path)
#     Json5Module.parse(content)
#   end
#
#   def enabled?(flag)
#     @flags[flag.to_s] == true
#   end
# end
#
# features = FeatureFlagManager.new('config/features.json5')
# puts "Feature Flags:"
# puts "  Dark Mode: #{features.enabled?(:darkMode)}"
# puts "  Beta Features: #{features.enabled?(:betaFeatures)}"
# puts

# Example 4: Settings with Nested Objects
# class AppSettings
#   def self.load(filepath)
#     content = File.read(filepath)
#     Json5Module.parse(content)
#   end
#
#   def self.load_app_settings
#     # settings.json5:
#     # {
#     #   app: {
#     #     name: "MyApp",
#     #     version: "1.0.0",
#     #   },
#     #   server: {
#     #     host: "0.0.0.0",
#     #     port: 3000,
#     #   }
#     # }
#     load('config/settings.json5')
#   end
# end
#
# settings = AppSettings.load_app_settings
# puts "App Settings:"
# puts "  Name: #{settings['app']['name']}"
# puts "  Port: #{settings['server']['port']}"
# puts

# Example 5: Environment-Specific Config
# class EnvironmentConfig
#   def initialize(env = 'development')
#     @env = env
#     @config = load_config
#   end
#
#   def load_config
#     # environment.json5:
#     # {
#     #   development: {
#     #     debug: true,
#     #     logLevel: "debug",
#     #   },
#     #   production: {
#     #     debug: false,
#     #     logLevel: "error",
#     #   }
#     # }
#     content = File.read('config/environment.json5')
#     all_config = Json5Module.parse(content)
#     all_config[@env]
#   end
#
#   def get(key, default = nil)
#     @config.fetch(key, default)
#   end
# end
#
# env_config = EnvironmentConfig.new('development')
# puts "Environment Config:"
# puts "  Debug: #{env_config.get('debug')}"
# puts "  Log Level: #{env_config.get('logLevel')}"

puts <<~USAGE

  USE CASES FOR JSON5 IN RUBY:
  =============================
  1. Rails Configuration - Parse configs with comments
  2. Feature Flags - Config-driven feature toggles
  3. API Clients - Handle JSON5 API responses
  4. Environment Configs - Per-environment settings
  5. Settings Management - Load app settings
  6. Build Configs - Parse build configuration
  7. Data Exchange - Share config with TypeScript services
  8. Documentation - Inline comments in config files

  PERFORMANCE BENEFITS:
  ====================
  - Elide's JIT compilation makes parsing extremely fast
  - Shared parser across languages reduces code duplication
  - Consistent behavior prevents parsing bugs
  - Single source of truth for JSON5 parsing
  - Native performance comparable to pure Ruby parsers
USAGE
