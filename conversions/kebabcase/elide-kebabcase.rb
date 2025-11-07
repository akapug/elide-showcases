#!/usr/bin/env ruby

# Ruby Integration Example for elide-kebabcase
# This demonstrates calling the TypeScript kebab-case implementation from Ruby.
# Benefits: Consistent URL slug generation across TypeScript and Ruby services.

puts "=== Ruby Calling TypeScript kebab-case ===\n"

# kebab_case = Elide.require('./elide-kebabcase.ts')

# Example: Rails URL Slug Generation
# class Post < ApplicationRecord
#   before_save :generate_slug
#
#   private
#   def generate_slug
#     self.slug = kebab_case.default(title)
#   end
# end
#
# post = Post.create(title: "Hello World Post")
# # post.slug => "hello-world-post"

# Example: CSS Class Helper
# module ApplicationHelper
#   def component_class(name)
#     "component-#{kebab_case.default(name)}"
#   end
# end
#
# component_class("UserProfile")  # "component-user-profile"

puts "Real-world use cases:"
puts "- Rails URL slug generation"
puts "- CSS class helper methods"
puts "- File name generation for static assets"
puts "- API endpoint naming conventions"
puts ""

puts "When Elide Ruby API is ready:"
puts "  kebab_case = Elide.require('./elide-kebabcase.ts')"
puts "  kebab_case.default('HelloWorld')  # 'hello-world'"
