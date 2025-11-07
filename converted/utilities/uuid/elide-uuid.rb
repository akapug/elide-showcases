#!/usr/bin/env ruby

# Ruby Integration Example for elide-uuid
#
# This demonstrates calling the TypeScript uuid implementation from Ruby
# using Elide's polyglot capabilities.
#
# Benefits:
# - One UUID implementation shared across TypeScript and Ruby
# - Consistent ID generation across microservices
# - No Ruby UUID gem needed
# - Perfect for Rails, Sidekiq, background workers

puts "=== Ruby Calling TypeScript UUID ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# This is a CONCEPTUAL example - adjust when Ruby support is ready

# Assuming Elide provides something like:
# uuid_module = Elide.require('./elide-uuid.ts')

# Example 1: Generate UUID
# uuid1 = uuid_module.v4()
# puts "Generated UUID: #{uuid1}"
# puts "Validation: #{uuid_module.validate(uuid1)}"
# puts ""

# Example 2: Use in Rails Model
# class User < ApplicationRecord
#   before_create :generate_uuid
#
#   private
#   def generate_uuid
#     self.uuid = uuid_module.v4()
#   end
# end
#
# user = User.create(name: "Alice")
# puts "User UUID: #{user.uuid}"
# puts ""

# Example 3: Background Job with Sidekiq
# class DataProcessingJob
#   include Sidekiq::Worker
#
#   def perform(data)
#     job_id = uuid_module.v4()
#     puts "Processing job #{job_id}"
#
#     # Use same UUID generator as Node.js API
#     records = data.map do |record|
#       record.merge(id: uuid_module.v4())
#     end
#
#     puts "Processed #{records.length} records"
#   end
# end

# Example 4: Validate UUIDs from API
# api_uuids = [
#   "123e4567-e89b-12d3-a456-426614174000",  # Valid
#   "invalid-uuid",                           # Invalid
#   uuid_module::NIL                          # Valid NIL
# ]
# api_uuids.each do |uuid|
#   is_valid = uuid_module.validate(uuid)
#   puts "UUID: #{uuid.ljust(45)} Valid: #{is_valid}"
# end
# puts ""

puts "Real-world use case:"
puts "- Ruby Sidekiq worker generates UUIDs for background jobs"
puts "- Uses same TypeScript implementation as Node.js API"
puts "- Guarantees consistent ID format across job queue"
puts "- No SecureRandom.uuid discrepancies"
puts ""

puts "Example: Microservices Architecture"
puts "┌─────────────────────────────────────┐"
puts "│   Elide UUID (TypeScript)          │"
puts "│   conversions/uuid/elide-uuid.ts   │"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Rails  │"
puts "    │  API   │  │ Worker │  │  App   │"
puts "    └────────┘  └────────┘  └────────┘"
puts "         ↓           ↓           ↓"
puts "    Same UUID format everywhere!"
puts ""

puts "Problem Solved:"
puts "Before: Ruby SecureRandom.uuid + JavaScript uuid = different formats"
puts "After: One Elide implementation = 100% consistent UUIDs"
puts ""

puts "Rails Integration (when ready):"
puts "  # config/initializers/uuid.rb"
puts "  UUID = Elide.require('./elide-uuid.ts')"
puts "  "
puts "  # app/models/user.rb"
puts "  class User < ApplicationRecord"
puts "    before_create { self.uuid = UUID.v4() }"
puts "  end"
puts ""

puts "Sidekiq Integration (when ready):"
puts "  class MyWorker"
puts "    include Sidekiq::Worker"
puts "    "
puts "    def perform"
puts "      id = UUID.v4()"
puts "      # Process with consistent ID"
puts "    end"
puts "  end"
