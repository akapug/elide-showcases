#!/usr/bin/env ruby
# frozen_string_literal: true

=begin
Ruby Integration Example for elide-yaml

This demonstrates calling the TypeScript YAML parser
from Ruby using Elide's polyglot capabilities.

Benefits:
- One YAML parser shared across TypeScript and Ruby
- Consistent configuration parsing across services
- Support for complex YAML features
- Perfect for Rails configs, deployment scripts
=end

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# require 'elide'
# YamlModule = Elide.require('./elide-yaml.ts')

puts "=== Ruby Calling TypeScript YAML Parser ==="
puts

# Example 1: Rails Database Configuration
# class DatabaseConfigLoader
#   def self.load(filepath)
#     content = File.read(filepath)
#     YamlModule.parse_yaml(content)
#   end
#
#   def self.load_database_yml
#     # database.yml:
#     # development:
#     #   adapter: postgresql
#     #   database: myapp_dev
#     #   host: localhost
#     #   port: 5432
#     load('config/database.yml')
#   end
# end
#
# db_config = DatabaseConfigLoader.load_database_yml
# puts "Database Config:"
# puts db_config.inspect
# puts

# Example 2: CI/CD Pipeline Parser
# class CIPipeline
#   attr_reader :config
#
#   def initialize(filepath)
#     content = File.read(filepath)
#     @config = YamlModule.parse_yaml(content)
#   end
#
#   def stages
#     @config['stages'] || []
#   end
#
#   def jobs(stage)
#     @config.dig('jobs', stage) || []
#   end
# end
#
# pipeline = CIPipeline.new('.gitlab-ci.yml')
# puts "Pipeline Stages:"
# puts pipeline.stages.inspect
# puts

# Example 3: Kubernetes Resource Parser
# class K8sResourceParser
#   def self.parse(filepath)
#     content = File.read(filepath)
#     YamlModule.parse_yaml(content)
#   end
#
#   def self.get_deployment_replicas(filepath)
#     resource = parse(filepath)
#     resource.dig('spec', 'replicas')
#   end
# end
#
# replicas = K8sResourceParser.get_deployment_replicas('deployment.yml')
# puts "Replicas: #{replicas}"
# puts

# Example 4: Feature Flag Manager
# class FeatureFlagLoader
#   def initialize(env = 'development')
#     filepath = "config/features/#{env}.yml"
#     content = File.read(filepath)
#     @flags = YamlModule.parse_yaml(content)
#   end
#
#   def enabled?(flag)
#     @flags[flag.to_s] == true
#   end
#
#   def get(flag, default = nil)
#     @flags.fetch(flag.to_s, default)
#   end
# end
#
# features = FeatureFlagLoader.new('production')
# puts "Feature Flags:"
# puts "  Dark Mode: #{features.enabled?('darkMode')}"
# puts

# Example 5: Application Settings Loader
# class SettingsLoader
#   def self.load_all_environments
#     environments = {}
#     %w[development test production].each do |env|
#       filepath = "config/settings/#{env}.yml"
#       next unless File.exist?(filepath)
#
#       content = File.read(filepath)
#       environments[env] = YamlModule.parse_yaml(content)
#     end
#     environments
#   end
#
#   def self.load_for_env(env)
#     filepath = "config/settings/#{env}.yml"
#     content = File.read(filepath)
#     YamlModule.parse_yaml(content)
#   end
# end
#
# settings = SettingsLoader.load_for_env('production')
# puts "Production Settings:"
# puts settings.inspect

puts <<~USAGE

  USE CASES FOR YAML IN RUBY:
  ============================
  1. Rails Configuration - database.yml, secrets.yml
  2. CI/CD Pipelines - Parse build configurations
  3. Kubernetes Resources - Deployment, service definitions
  4. Feature Flags - Environment-specific flags
  5. Settings Management - Per-environment settings
  6. Infrastructure as Code - Ansible, Chef, Puppet configs
  7. API Specifications - OpenAPI/Swagger definitions
  8. Data Serialization - Configuration data exchange

  PERFORMANCE BENEFITS:
  ====================
  - Elide's JIT compilation makes parsing extremely fast
  - Shared parser across languages reduces code duplication
  - Consistent behavior prevents parsing bugs
  - Single source of truth for YAML parsing
  - Native performance comparable to pure Ruby parsers
USAGE
