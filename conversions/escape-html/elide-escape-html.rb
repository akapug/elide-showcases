#!/usr/bin/env ruby

# Ruby Integration Example for elide-escape-html (HTML Entity Escaper)
#
# Demonstrates calling the TypeScript escape-html implementation from Ruby
# for consistent XSS protection across microservices.

puts "=== Ruby Calling TypeScript Escape HTML ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# escape_html = Elide.require('./elide-escape-html.ts')

# Example 1: Basic HTML escaping
# dangerous = "<script>alert('XSS')</script>"
# safe = escape_html.escape(dangerous)
# puts "Dangerous: #{dangerous}"
# puts "Safe: #{safe}"
# # Output: &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;

# Example 2: Rails controller with XSS protection
# class CommentsController < ApplicationController
#   def create
#     user_input = params[:comment][:body]
#
#     # Use TypeScript HTML escaper from Ruby
#     escape_html = Elide.require('./elide-escape-html.ts')
#     safe_comment = escape_html.escape(user_input)
#
#     @comment = Comment.create!(body: safe_comment)
#     render json: { comment: safe_comment, status: 'safe' }
#   end
# end

# Example 3: Sinatra app with consistent escaping
# require 'sinatra'
# ESCAPE_HTML = Elide.require('./elide-escape-html.ts')
#
# post '/api/post' do
#   user_title = params['title']
#   user_body = params['body']
#
#   # Escape using same implementation as Node.js
#   safe_title = ESCAPE_HTML.escape(user_title)
#   safe_body = ESCAPE_HTML.escape(user_body)
#
#   # Save to database (XSS-safe)
#   Post.create(title: safe_title, body: safe_body)
#
#   json status: 'success', title: safe_title
# end

# Example 4: Email template generation
# def send_notification_email(user)
#   escape_html = Elide.require('./elide-escape-html.ts')
#
#   # Escape user data for HTML email
#   safe_name = escape_html.escape(user.name)
#   safe_message = escape_html.escape(user.message)
#
#   html_body = <<-HTML
#     <html>
#       <body>
#         <h1>Hello, #{safe_name}!</h1>
#         <p>#{safe_message}</p>
#       </body>
#     </html>
#   HTML
#
#   Mailer.send(user.email, "Notification", html_body)
# end

# Example 5: Sidekiq job with HTML sanitization
# class RenderHtmlWorker
#   include Sidekiq::Worker
#
#   def perform(user_id, content)
#     escape_html = Elide.require('./elide-escape-html.ts')
#
#     # Sanitize content before rendering
#     safe_content = escape_html.escape(content)
#
#     # Generate HTML report
#     html = generate_report(safe_content)
#     save_report(user_id, html)
#   end
# end

# Example 6: API response sanitization
# require 'grape'
# class API < Grape::API
#   format :json
#
#   helpers do
#     def escape_html
#       @escape_html ||= Elide.require('./elide-escape-html.ts')
#     end
#   end
#
#   get '/users/:id' do
#     user = User.find(params[:id])
#
#     # Escape all user-generated fields
#     {
#       name: escape_html.escape(user.name),
#       bio: escape_html.escape(user.bio),
#       website: escape_html.escape(user.website)
#     }
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails app receives user input"
puts "- Uses same HTML escaper as Node.js frontend"
puts "- Guarantees identical XSS protection across all services"
puts ""

puts "Example: Unified XSS Protection"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Escape HTML (TypeScript)   │"
puts "│   conversions/escape-html/*.ts     │"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓"
puts "    ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │"
puts "    │  SSR   │  │  Rails │"
puts "    └────────┘  └────────┘"
puts "     escape(input)   escape(input)"
puts "     = &lt;safe&gt;   = &lt;safe&gt;"
puts "     ✓ Consistent protection!"
puts ""

puts "Problem Solved:"
puts "Before: ERB::Util.html_escape vs Node.js escaping = inconsistencies"
puts "After: One Elide implementation = perfect XSS prevention"
puts ""

puts "Security Example:"
puts "  # User input"
puts "  user_input = '<img src=x onerror=alert(1)>'"
puts "  "
puts "  # Escape using shared implementation"
puts "  safe = escape_html.escape(user_input)"
puts "  # Result: &lt;img src=x onerror=alert(1)&gt;"
puts "  "
puts "  # Same escaping in Node.js, Python, Ruby, Java!"
puts "  # ✓ Unified security standard"
