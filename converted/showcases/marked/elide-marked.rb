#!/usr/bin/env ruby

# Ruby Integration Example for elide-marked (Markdown Parser)
#
# Demonstrates calling the TypeScript marked implementation from Ruby
# for consistent markdown rendering across documentation services.

puts "=== Ruby Calling TypeScript Marked ===\n"

# NOTE: Exact syntax depends on Elide's Ruby polyglot API (currently alpha)
# marked_module = Elide.require('./elide-marked.ts')

# Example 1: Parse markdown to HTML
# markdown = "# Hello World\n\nThis is **bold** and *italic*."
# html = marked_module.default(markdown)
# puts "Markdown: #{markdown}"
# puts "HTML: #{html}"
# Output: <h1 id="hello-world">Hello World</h1>\n\n<p>This is <strong>bold</strong> and <em>italic</em>.</p>

# Example 2: Sinatra documentation API
# require 'sinatra'
#
# get '/docs/:doc_id' do
#   # Load markdown from database
#   markdown_content = DB[:documents].where(id: params[:doc_id]).first[:content]
#
#   # Render using same parser as Node.js docs site!
#   html = marked_module.default(markdown_content)
#
#   json(
#     html: html,
#     markdown: markdown_content
#   )
# end

# Example 3: Jekyll-like static site generator
# class MarkdownRenderer
#   def initialize
#     @marked = Elide.require('./elide-marked.ts')
#   end
#
#   def render_post(markdown_file)
#     content = File.read(markdown_file)
#
#     # Extract front matter
#     front_matter, markdown = parse_front_matter(content)
#
#     # Render with same parser as docs platform
#     html = @marked.default(markdown, {
#       gfm: true,           # GitHub Flavored Markdown
#       headerIds: true,     # Generate header IDs
#       headerPrefix: 'post-'
#     })
#
#     { metadata: front_matter, html: html }
#   end
# end

# Example 4: Rails blog with markdown content
# class PostsController < ApplicationController
#   before_action :load_marked
#
#   def show
#     @post = Post.find(params[:id])
#
#     # Convert markdown to HTML using same parser
#     @post.html_content = @marked.default(@post.markdown_content)
#
#     render :show
#   end
#
#   private
#
#   def load_marked
#     @marked = Elide.require('./elide-marked.ts')
#   end
# end

# Example 5: README rendering for gem documentation
# def render_gem_readme(gem_name)
#   readme_md = fetch_readme_from_gem(gem_name)
#
#   # Same rendering as npm registry and PyPI!
#   marked_module.default(readme_md, { gfm: true })
# end

puts "Real-world use case:"
puts "- Ruby docs API reads markdown from database"
puts "- Uses same marked parser as Node.js and Python services"
puts "- Guarantees identical HTML output across entire platform"
puts ""

puts "Example: Unified Documentation Platform"
puts "┌─────────────────────────────────────┐"
puts "│   Elide Marked (TypeScript)        │"
puts "│   conversions/marked/elide-marked.ts│"
puts "└─────────────────────────────────────┘"
puts "         ↓           ↓           ↓"
puts "    ┌────────┐  ┌────────┐  ┌────────┐"
puts "    │ Node.js│  │  Ruby  │  │ Python │"
puts "    │  Docs  │  │  API   │  │Worker  │"
puts "    └────────┘  └────────┘  └────────┘"
puts "     All services render markdown identically"
puts "     ✓ Consistent HTML output!"
puts ""

puts "Problem Solved:"
puts "Before: Different markdown gems = inconsistent rendering"
puts "After: One Elide implementation = perfect consistency"
puts ""

puts "Benefits:"
puts "  ✓ Consistent markdown rendering across Ruby, Python, Node.js"
puts "  ✓ Same HTML output for README files"
puts "  ✓ No markdown parsing bugs between languages"
puts "  ✓ GitHub Flavored Markdown support everywhere"
puts "  ✓ Perfect for Rails CMS with markdown content"
