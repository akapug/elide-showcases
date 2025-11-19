-- Seed Data for Ghost Clone

-- Create default admin user
-- Password: Admin123456 (hashed with bcrypt)
INSERT INTO users (name, email, password, slug, role, bio)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2b$10$rB8qXJZ5OqYJzKqH8Nf5/.0qKvVvWxLJy7RwZ8KLzHpUWK7Q7jXBe',
  'admin-user',
  'admin',
  'The site administrator'
);

-- Create sample tags
INSERT INTO tags (name, slug, description) VALUES
  ('Getting Started', 'getting-started', 'Learn how to use this platform'),
  ('Technology', 'technology', 'Posts about technology and development'),
  ('News', 'news', 'Latest news and updates'),
  ('Tutorial', 'tutorial', 'Step-by-step guides'),
  ('Featured', 'featured', 'Featured content');

-- Create welcome post
INSERT INTO posts (
  uuid,
  title,
  slug,
  markdown,
  html,
  status,
  visibility,
  author_id,
  published_at,
  custom_excerpt,
  meta_description
) VALUES (
  'welcome-post-001',
  'Welcome to Your New Blog',
  'welcome',
  '# Welcome to Ghost Clone

Welcome to your new blog powered by Elide! This is your first post. You can edit or delete it from the admin dashboard.

## Getting Started

To get started, log in to the admin dashboard at `/admin` and create your first post. Here are some things you can do:

- **Write posts** in Markdown or rich text
- **Upload images** and media
- **Customize your theme** and settings
- **Manage users** and permissions
- **Track analytics** and performance

## Features

This platform includes everything you need to run a modern blog:

- ✅ Powerful content editor
- ✅ SEO optimization
- ✅ Social sharing
- ✅ RSS feeds
- ✅ Custom themes
- ✅ Analytics dashboard
- ✅ User management
- ✅ API access

## Learn More

Check out the documentation to learn more about using this platform effectively.

Happy publishing!',
  '<h1>Welcome to Ghost Clone</h1>
<p>Welcome to your new blog powered by Elide! This is your first post. You can edit or delete it from the admin dashboard.</p>
<h2>Getting Started</h2>
<p>To get started, log in to the admin dashboard at <code>/admin</code> and create your first post. Here are some things you can do:</p>
<ul>
<li><strong>Write posts</strong> in Markdown or rich text</li>
<li><strong>Upload images</strong> and media</li>
<li><strong>Customize your theme</strong> and settings</li>
<li><strong>Manage users</strong> and permissions</li>
<li><strong>Track analytics</strong> and performance</li>
</ul>
<h2>Features</h2>
<p>This platform includes everything you need to run a modern blog:</p>
<ul>
<li>✅ Powerful content editor</li>
<li>✅ SEO optimization</li>
<li>✅ Social sharing</li>
<li>✅ RSS feeds</li>
<li>✅ Custom themes</li>
<li>✅ Analytics dashboard</li>
<li>✅ User management</li>
<li>✅ API access</li>
</ul>
<h2>Learn More</h2>
<p>Check out the documentation to learn more about using this platform effectively.</p>
<p>Happy publishing!</p>',
  'published',
  'public',
  1,
  CURRENT_TIMESTAMP,
  'Welcome to your new blog powered by Elide! Learn how to get started.',
  'Welcome to your new blog powered by Elide! Learn how to get started with creating posts, customizing themes, and more.'
);

-- Link tags to welcome post
INSERT INTO posts_tags (post_id, tag_id, sort_order) VALUES
  (1, 1, 0),
  (1, 5, 1);

-- Create about page
INSERT INTO pages (
  uuid,
  title,
  slug,
  markdown,
  html,
  status,
  visibility,
  author_id,
  published_at
) VALUES (
  'about-page-001',
  'About',
  'about',
  '# About This Blog

This is a modern publishing platform built with Elide, demonstrating the power and flexibility of the framework.

## Our Mission

To provide a fast, reliable, and feature-rich blogging platform that makes publishing content easy and enjoyable.

## Technology

Built with:
- **Elide** - High-performance polyglot runtime
- **SQLite** - Reliable embedded database
- **Modern JavaScript** - Clean, maintainable code

## Contact

Feel free to reach out if you have any questions!',
  '<h1>About This Blog</h1>
<p>This is a modern publishing platform built with Elide, demonstrating the power and flexibility of the framework.</p>
<h2>Our Mission</h2>
<p>To provide a fast, reliable, and feature-rich blogging platform that makes publishing content easy and enjoyable.</p>
<h2>Technology</h2>
<p>Built with:</p>
<ul>
<li><strong>Elide</strong> - High-performance polyglot runtime</li>
<li><strong>SQLite</strong> - Reliable embedded database</li>
<li><strong>Modern JavaScript</strong> - Clean, maintainable code</li>
</ul>
<h2>Contact</h2>
<p>Feel free to reach out if you have any questions!</p>',
  'published',
  'public',
  1,
  CURRENT_TIMESTAMP
);
