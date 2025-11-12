# Ruby Content Management Resolvers
# Conceptual implementation showing how Ruby resolvers would work

require 'json'
require 'time'

class PostsResolver
  # Ruby-based content management resolvers for GraphQL

  def self.get_post(id)
    # In production, query database
    # Ruby excels at content management workflows
    {
      id: id,
      title: 'Sample Post',
      content: 'This is great content...',
      author_id: '1',
      category: 'tutorial',
      published_at: Time.now.iso8601,
      status: 'published',
      tags: ['ruby', 'graphql', 'elide'],
      metadata: {
        word_count: 1500,
        reading_time: 7,
        seo_score: 85
      }
    }
  end

  def self.get_posts(category: nil, limit: 20)
    # Simulate fetching posts
    # Ruby's elegant syntax for content operations
    posts = [
      {
        id: '1',
        title: 'Getting Started with GraphQL',
        content: 'GraphQL is amazing...',
        author_id: '1',
        category: 'tutorial',
        published_at: Time.now.iso8601,
        status: 'published'
      },
      {
        id: '2',
        title: 'Polyglot Programming',
        content: 'Multiple languages...',
        author_id: '2',
        category: 'architecture',
        published_at: nil,
        status: 'draft'
      }
    ]

    # Filter by category if provided
    posts = posts.select { |p| p[:category] == category } if category

    # Apply limit
    posts.take(limit)
  end

  def self.create_post(input)
    # Create new post
    # Ruby's hash manipulation is perfect for CMS
    new_post = {
      id: SecureRandom.uuid,
      title: input[:title],
      content: input[:content],
      author_id: input[:author_id],
      category: input[:category],
      published_at: nil,
      status: 'draft',
      created_at: Time.now.iso8601,
      updated_at: Time.now.iso8601,
      slug: slugify(input[:title]),
      tags: extract_tags(input[:content])
    }

    puts "[Ruby CMS] Post created: #{new_post[:title]}"
    new_post
  end

  def self.publish_post(id)
    # Publish a draft post
    # Ruby's expressiveness for workflow logic
    post = get_post(id)

    post[:status] = 'published'
    post[:published_at] = Time.now.iso8601

    # Trigger post-publish actions
    notify_subscribers(post)
    update_sitemap(post)
    invalidate_cache(post)

    puts "[Ruby CMS] Post published: #{post[:title]}"
    post
  end

  private

  def self.slugify(title)
    # Convert title to URL-friendly slug
    title.downcase.gsub(/\s+/, '-').gsub(/[^a-z0-9-]/, '')
  end

  def self.extract_tags(content)
    # Extract hashtags from content
    content.scan(/#(\w+)/).flatten
  end

  def self.notify_subscribers(post)
    puts "  → Notifying subscribers about: #{post[:title]}"
  end

  def self.update_sitemap(post)
    puts "  → Updating sitemap with: #{post[:slug]}"
  end

  def self.invalidate_cache(post)
    puts "  → Invalidating cache for: #{post[:id]}"
  end
end

# Example usage in Elide
if __FILE__ == $PROGRAM_NAME
  # Get post
  post = PostsResolver.get_post('1')
  puts "Post: #{post.to_json}"

  # List posts
  posts = PostsResolver.get_posts(category: 'tutorial', limit: 5)
  puts "Posts: #{posts.to_json}"

  # Create post
  new_post = PostsResolver.create_post({
    title: 'New Blog Post',
    content: 'Great content with #ruby and #graphql',
    author_id: '1',
    category: 'technical'
  })
  puts "Created: #{new_post.to_json}"

  # Publish post
  published = PostsResolver.publish_post(new_post[:id])
  puts "Published: #{published.to_json}"
end
