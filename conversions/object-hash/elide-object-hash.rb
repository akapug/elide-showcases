#!/usr/bin/env ruby
# frozen_string_literal: true
puts "=== Ruby Calling TypeScript Object Hash ==="
puts
puts "Real-world use case: Generate cache keys for Ruby services"
puts "When Elide Ruby API is ready:"
puts "  hash_module = Elide.require('./elide-object-hash.ts')"
puts "  cache_key = hash_module.call(:default, {endpoint: '/users', params: {page: 1}})"
