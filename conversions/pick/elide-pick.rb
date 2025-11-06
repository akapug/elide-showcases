#!/usr/bin/env ruby
# frozen_string_literal: true

puts "=== Ruby Calling TypeScript Pick ==="
puts
puts "Real-world use case:"
puts "- Ruby Rails apps create DTOs"
puts "- Uses same TypeScript implementation as Node.js service"
puts "- Consistent data projection across entire stack"
puts
puts "When Elide Ruby API is ready, usage will be:"
puts "  pick_module = Elide.require('./elide-pick.ts')"
puts "  dto = pick_module.call(:default, user, 'id', 'username', 'email')  # That's it!"
