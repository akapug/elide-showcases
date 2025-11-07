#!/usr/bin/env ruby

# Ruby Integration Example for elide-dedent
#
# This demonstrates calling the TypeScript dedent implementation
# from Ruby using Elide's polyglot capabilities.
#
# Benefits:
# - One dedent implementation shared across TypeScript and Ruby
# - Consistent string formatting across microservices
# - No Ruby heredoc workarounds needed
# - Perfect for Rails SQL queries, templates

puts "=== Ruby Calling TypeScript Dedent ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# dedent_module = Elide.require('./elide-dedent.ts')

# Example 1: ActiveRecord SQL Queries
# class User < ApplicationRecord
#   def self.active_users_sql
#     dedent_module.default(<<~SQL
#       SELECT users.*, COUNT(posts.id) as post_count
#       FROM users
#       LEFT JOIN posts ON posts.user_id = users.id
#       WHERE users.active = true
#       GROUP BY users.id
#       ORDER BY post_count DESC
#     SQL
#     )
#   end
# end

# Example 2: Email Templates in Rails
# class UserMailer < ApplicationMailer
#   def welcome_email(user)
#     body = dedent_module.default(<<~TEXT
#       Hello #{user.name}!
#
#       Welcome to our platform.
#
#       Your account details:
#       - Email: #{user.email}
#       - Username: #{user.username}
#
#       Best regards,
#       The Team
#     TEXT
#     )
#     mail(to: user.email, subject: 'Welcome!', body: body)
#   end
# end

# Example 3: ERB Template Formatting
# class TemplateHelper
#   def self.render_user_card(user)
#     template = dedent_module.default(<<~HTML
#       <div class="user-card">
#         <h2><%= user.name %></h2>
#         <p><%= user.email %></p>
#         <p>Member since: <%= user.created_at.strftime('%Y-%m-%d') %></p>
#       </div>
#     HTML
#     )
#     ERB.new(template).result(binding)
#   end
# end

# Example 4: Rake Task Documentation
# namespace :users do
#   desc dedent_module.default(<<~DESC
#     Import users from CSV file
#
#     Usage: rake users:import FILE=users.csv
#
#     The CSV should have columns: name, email, username
#   DESC
#   )
#   task :import do
#     # Import logic
#   end
# end

# Example 5: Configuration Generation
# class ConfigGenerator
#   def self.generate_redis_config(host, port)
#     dedent_module.default(<<~CONF
#       host: #{host}
#       port: #{port}
#       timeout: 5
#       db: 0
#       pool: 5
#     CONF
#     )
#   end
# end

puts "Real-world use cases:"
puts "- ActiveRecord SQL query formatting"
puts "- Email template generation"
puts "- ERB/HAML template strings"
puts "- Rake task descriptions"
puts "- Configuration file generation"
puts "- Multi-line string literals in Rails"
puts ""

puts "Example: Rails E-Commerce Platform"
puts "┌──────────────────────────────────────┐"
puts "│   Elide Dedent (TypeScript)         │"
puts "│   elide-dedent.ts                   │"
puts "└──────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Rails │  │ Sidekiq│"
puts "    │  API   │  │  App   │  │ Worker │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same clean strings everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby <<~ heredoc + JS dedent = different behavior"
puts "After: One Elide implementation = consistent formatting"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/dedent.rb"
puts "  DEDENT = Elide.require('./elide-dedent.ts')"
puts "  "
puts "  # app/models/query_builder.rb"
puts "  class QueryBuilder"
puts "    def self.complex_query"
puts "      DEDENT.default(<<~SQL"
puts "        SELECT * FROM users"
puts "        WHERE active = true"
puts "      SQL"
puts "      )"
puts "    end"
puts "  end"
