#!/usr/bin/env ruby

# Ruby Integration Example for elide-validator
#
# This demonstrates calling the TypeScript validator implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One validation implementation shared across TypeScript and Ruby
# - Consistent validation rules across frontend and workers
# - No Ruby validator gem needed
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript Validator ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# validator = Elide.require('./elide-validator.ts')

# Example 1: Rails Model Validation
# class User < ApplicationRecord
#   validate :valid_email
#   validate :valid_website
#
#   private
#   def valid_email
#     unless validator.isEmail(email)
#       errors.add(:email, "is not a valid email address")
#     end
#   end
#
#   def valid_website
#     if website.present? && !validator.isURL(website, { requireProtocol: true })
#       errors.add(:website, "is not a valid URL")
#     end
#   end
# end

# Example 2: Sidekiq Worker with Validation
# class PaymentProcessorWorker
#   include Sidekiq::Worker
#
#   def perform(payment_data)
#     card_number = payment_data['card_number']
#     email = payment_data['email']
#
#     # Validate credit card using Luhn algorithm
#     unless validator.isCreditCard(card_number)
#       logger.error "Invalid credit card: #{payment_data['id']}"
#       return
#     end
#
#     # Validate email
#     unless validator.isEmail(email)
#       logger.error "Invalid email: #{email}"
#       return
#     end
#
#     # Process payment
#     process_payment(payment_data)
#   end
# end

# Example 3: API Endpoint Validation
# class Api::UsersController < ApplicationController
#   def create
#     email = params[:email]
#     phone = params[:phone]
#     website = params[:website]
#
#     # Validate all inputs
#     errors = []
#     errors << "Invalid email" unless validator.isEmail(email)
#     errors << "Invalid phone" unless validator.isMobilePhone(phone)
#     errors << "Invalid website" unless website.blank? || validator.isURL(website)
#
#     if errors.any?
#       render json: { errors: errors }, status: :bad_request
#       return
#     end
#
#     # Normalize email for deduplication
#     normalized_email = validator.normalizeEmail(email)
#
#     user = User.create!(
#       email: normalized_email,
#       phone: phone,
#       website: website
#     )
#
#     render json: user, status: :created
#   end
# end

# Example 4: IP Whitelist Validation
# class SecurityFilter
#   def self.allowed_ip?(ip_address)
#     # Validate IP format
#     return false unless validator.isIP(ip_address, 4)
#
#     # Check whitelist
#     whitelist = ENV['IP_WHITELIST'].split(',')
#     validator.isIn(ip_address, whitelist)
#   end
# end
#
# test_ips = ["192.168.1.1", "256.1.1.1", "10.0.0.1"]
# test_ips.each do |ip|
#   allowed = SecurityFilter.allowed_ip?(ip)
#   puts "IP #{ip}: #{allowed ? 'allowed' : 'blocked'}"
# end

# Example 5: HTML Sanitization for User Content
# class Comment < ApplicationRecord
#   before_save :sanitize_content
#
#   private
#   def sanitize_content
#     # Escape HTML to prevent XSS
#     self.content = validator.escape(content)
#   end
# end

puts "Real-world use case:"
puts "- Ruby Rails API validates user registration"
puts "- Sidekiq workers validate payment data"
puts "- Uses same TypeScript implementation as Node.js frontend"
puts "- Guarantees consistent validation across entire platform"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Validator (TypeScript)     │"
puts "│   conversions/validator/            │"
puts "│   elide-validator.ts                │"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same validation rules everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Rails validators + JavaScript validators = different rules"
puts "After: One Elide implementation = 100% consistent validation"
puts ""

puts "Security Benefits:"
puts "- Unified XSS prevention with escape()"
puts "- Consistent email/URL validation prevents injection"
puts "- Credit card validation with Luhn algorithm"
puts "- No frontend/backend validation discrepancies"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/validator.rb"
puts "  VALIDATOR = Elide.require('./elide-validator.ts')"
puts "  "
puts "  # app/models/user.rb"
puts "  class User < ApplicationRecord"
puts "    validate :email_format"
puts "    "
puts "    private"
puts "    def email_format"
puts "      unless VALIDATOR.isEmail(email)"
puts "        errors.add(:email, 'is invalid')"
puts "      end"
puts "    end"
puts "  end"
puts ""

puts "Sidekiq Integration (when ready):"
puts "  class DataValidator"
puts "    include Sidekiq::Worker"
puts "    "
puts "    def perform(data)"
puts "      if VALIDATOR.isEmail(data['email'])"
puts "        process_valid_data(data)"
puts "      end"
puts "    end"
puts "  end"
