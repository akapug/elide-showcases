#!/usr/bin/env ruby

# Ruby Integration Example for elide-entities
#
# This demonstrates calling the TypeScript HTML entities implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One entity encoder shared across TypeScript and Ruby
# - Consistent HTML safety across microservices
# - No CGI.escapeHTML needed
# - Perfect for Rails, Sinatra template rendering

puts "=== Ruby Calling TypeScript HTML Entities ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# entities = Elide.require('./elide-entities.ts')

# Example 1: Rails View Helper
# module ApplicationHelper
#   def safe_user_content(content)
#     entities.escapeHTML(content)
#   end
# end

# Example 2: Sinatra Route
# require 'sinatra'
#
# post '/comment' do
#   comment = params[:comment]
#   safe_comment = entities.encode(comment)
#   erb :comment, locals: { comment: safe_comment }
# end

# Example 3: Email Generation
# class UserMailer < ApplicationMailer
#   def welcome_email(user)
#     @safe_name = entities.escapeHTML(user.name)
#     @safe_bio = entities.escapeHTML(user.bio)
#     mail(to: user.email, subject: 'Welcome')
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails app encodes user input for templates"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent XSS protection"
puts "- No CGI.escapeHTML needed"
puts ""

puts "Example: Web Application"
puts "┌─────────────────────────────────────────────┐"
puts "│   Elide HTML Entities (TypeScript)         │"
puts "│   elide-entities.ts                        │"
puts "└─────────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │Sinatra │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same HTML encoding everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Different HTML encoding = security gaps"
puts "After: One Elide implementation = unified security"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/entities.rb"
puts "  ENTITIES = Elide.require('./elide-entities.ts')"
puts "  "
puts "  # app/helpers/application_helper.rb"
puts "  def safe_html(content)"
puts "    ENTITIES.escapeHTML(content)"
puts "  end"
