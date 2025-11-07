#!/usr/bin/env ruby
# frozen_string_literal: true
puts "=== Ruby Calling TypeScript Extend Shallow ==="
puts
puts "Real-world use case: Merge Rails config options"
puts "When Elide Ruby API is ready:"
puts "  extend_module = Elide.require('./elide-extend-shallow.ts')"
puts "  config = extend_module.call(:default, defaults, user_opts)"
