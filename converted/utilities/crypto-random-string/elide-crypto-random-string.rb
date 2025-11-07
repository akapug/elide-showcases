#!/usr/bin/env ruby

# Ruby Integration Example for elide-crypto-random-string
#
# This demonstrates calling the TypeScript crypto random string generator
# from Ruby using Elide's polyglot capabilities.
#
# Benefits:
# - One secure random generator shared across TypeScript and Ruby
# - Consistent token/password generation across microservices
# - No Ruby SecureRandom needed for complex formats
# - Perfect for Rails authentication, session management

puts "=== Ruby Calling TypeScript Crypto Random String ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# crypto_module = Elide.require('./elide-crypto-random-string.ts')

# Example 1: Rails Session Token Generator
# class SessionsController < ApplicationController
#   def create
#     session_id = crypto_module.cryptoRandomHex(24)
#     session[:id] = session_id
#     session[:user_id] = params[:user_id]
#     render json: { session_id: session_id }
#   end
# end

# Example 2: API Key Generation
# class ApiKey < ApplicationRecord
#   before_create :generate_key
#
#   def generate_key
#     self.key = crypto_module.cryptoRandomURLSafe(32)
#   end
#
#   def self.create_for_user(user)
#     create(user: user)
#   end
# end
#
# puts "API Keys:"
# 3.times do |i|
#   key = crypto_module.cryptoRandomURLSafe(32) rescue "key_#{i}"
#   puts "  Key #{i+1}: #{key}"
# end
# puts ""

# Example 3: Password Reset Token
# class PasswordResetService
#   def initialize
#     @tokens = {}
#   end
#
#   def generate_reset_token(user_id)
#     token = crypto_module.cryptoRandomURLSafe(32)
#     @tokens[token] = {
#       user_id: user_id,
#       expires_at: Time.now + 3600
#     }
#     token
#   end
#
#   def validate_token(token)
#     data = @tokens[token]
#     return false unless data
#     return false if Time.now > data[:expires_at]
#     true
#   end
# end
#
# service = PasswordResetService.new
# puts "Password Reset Tokens:"
# ['user_1', 'user_2', 'user_3'].each do |user_id|
#   token = service.generate_reset_token(user_id)
#   puts "  #{user_id}: #{token}"
# end
# puts ""

# Example 4: Sidekiq Job IDs
# class ProcessDataJob
#   include Sidekiq::Worker
#
#   def perform(data)
#     job_id = crypto_module.cryptoRandomHex(16)
#     Rails.logger.info("Processing job: #{job_id}")
#     # Process data...
#   end
# end

# Example 5: CSRF Token for Rails Forms
# module CsrfProtection
#   def self.generate_token
#     crypto_module.cryptoRandomURLSafe(32)
#   end
#
#   def self.token_tag
#     token = generate_token
#     "<input type='hidden' name='csrf_token' value='#{token}' />"
#   end
# end
#
# puts "CSRF Tokens:"
# 3.times do |i|
#   token = crypto_module.cryptoRandomURLSafe(32) rescue "token_#{i}"
#   puts "  #{i+1}. #{token}"
# end
# puts ""

# Example 6: Database Record IDs
# class User < ApplicationRecord
#   before_create :generate_public_id
#
#   def generate_public_id
#     self.public_id = "user_#{crypto_module.cryptoRandomHex(12)}"
#   end
# end
#
# puts "User IDs:"
# ['alice', 'bob', 'charlie'].each do |name|
#   user_id = "user_#{SecureRandom.hex(12)}"
#   puts "  #{name}: #{user_id}"
# end
# puts ""

# Example 7: OTP Code Generation
# class OtpService
#   def initialize
#     @otps = {}
#   end
#
#   def generate_otp(user_id, length = 6)
#     otp = crypto_module.cryptoRandomNumeric(length)
#     @otps[user_id] = {
#       code: otp,
#       created_at: Time.now
#     }
#     otp
#   end
#
#   def verify_otp(user_id, code)
#     stored = @otps[user_id]
#     return false unless stored
#     return false if Time.now - stored[:created_at] > 300 # 5 min expiry
#     stored[:code] == code
#   end
# end
#
# otp_service = OtpService.new
# puts "OTP Codes (6 digits):"
# 5.times do |i|
#   otp = (0...6).map { rand(10) }.join
#   puts "  #{otp}"
# end
# puts ""

# Example 8: File Upload Service
# class UploadService
#   def self.generate_filename(original_filename)
#     extension = File.extname(original_filename)
#     random_name = crypto_module.cryptoRandomURLSafe(16)
#     "#{random_name}#{extension}"
#   end
#
#   def self.upload_file(file)
#     filename = generate_filename(file.original_filename)
#     # Save file with secure filename
#     filename
#   end
# end
#
# puts "Secure Upload Filenames:"
# ['document.pdf', 'image.jpg', 'data.csv'].each do |filename|
#   secure_name = "#{SecureRandom.urlsafe_base64(16)}.#{File.extname(filename)[1..-1]}"
#   puts "  #{filename} -> #{secure_name}"
# end
# puts ""

# Example 9: Invitation Codes
# class InvitationService
#   def generate_invitation_code
#     # Distinguishable characters for easy sharing
#     crypto_module.cryptoRandomDistinguishable(8)
#   end
#
#   def format_code(code)
#     # Format as XXXX-XXXX for readability
#     "#{code[0..3]}-#{code[4..7]}"
#   end
# end
#
# service = InvitationService.new
# puts "Invitation Codes (human-friendly):"
# 5.times do
#   code = (0...8).map { %w[C D E H K M P R T U W X Y 0 1 2 4 5 8].sample }.join
#   formatted = "#{code[0..3]}-#{code[4..7]}"
#   puts "  #{formatted}"
# end
# puts ""

puts "Real-world use cases:"
puts "- Rails session token generation"
puts "- API key creation for authentication"
puts "- Password reset tokens"
puts "- Sidekiq job IDs"
puts "- CSRF protection for forms"
puts "- Secure database record IDs"
puts "- OTP codes for 2FA"
puts "- File upload naming"
puts "- Invitation code generation"
puts ""

puts "Example: Rails E-Commerce Platform"
puts "┌──────────────────────────────────────────┐"
puts "│   Elide Crypto Random (TypeScript)     │"
puts "│   crypto-random-string.ts               │"
puts "└──────────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Rails │  │ Sidekiq│"
puts "    │  API   │  │  App   │  │ Worker │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same secure tokens everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby SecureRandom + JS crypto-random-string = different formats"
puts "After: One Elide implementation = consistent tokens"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/crypto.rb"
puts "  CRYPTO = Elide.require('./elide-crypto-random-string.ts')"
puts "  "
puts "  # app/models/user.rb"
puts "  class User < ApplicationRecord"
puts "    before_create :generate_api_key"
puts "    "
puts "    def generate_api_key"
puts "      self.api_key = CRYPTO.cryptoRandomURLSafe(32)"
puts "    end"
puts "  end"
puts ""

puts "Sidekiq Integration (when ready):"
puts "  class ProcessJob"
puts "    include Sidekiq::Worker"
puts "    "
puts "    def perform(data)"
puts "      job_id = CRYPTO.cryptoRandomHex(16)"
puts "      # Use consistent, secure job IDs"
puts "    end"
puts "  end"
