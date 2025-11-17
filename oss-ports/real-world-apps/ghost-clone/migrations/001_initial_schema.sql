-- Initial Database Schema for Ghost Clone

-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  profile_image TEXT,
  cover_image TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  facebook TEXT,
  twitter TEXT,
  role TEXT NOT NULL DEFAULT 'author',
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  markdown TEXT,
  html TEXT,
  feature_image TEXT,
  featured INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  visibility TEXT NOT NULL DEFAULT 'public',
  author_id INTEGER NOT NULL,
  published_at DATETIME,
  custom_excerpt TEXT,
  codeinjection_head TEXT,
  codeinjection_foot TEXT,
  og_image TEXT,
  og_title TEXT,
  og_description TEXT,
  twitter_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  email_subject TEXT,
  frontmatter TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pages table (similar to posts but for static pages)
CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  markdown TEXT,
  html TEXT,
  feature_image TEXT,
  featured INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  visibility TEXT NOT NULL DEFAULT 'public',
  author_id INTEGER NOT NULL,
  published_at DATETIME,
  custom_excerpt TEXT,
  codeinjection_head TEXT,
  codeinjection_foot TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  feature_image TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  og_image TEXT,
  og_title TEXT,
  og_description TEXT,
  twitter_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  codeinjection_head TEXT,
  codeinjection_foot TEXT,
  canonical_url TEXT,
  accent_color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Post-Tag relationships
CREATE TABLE posts_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(post_id, tag_id)
);

-- Settings table
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  type TEXT NOT NULL DEFAULT 'string',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (key, value, type) VALUES
  ('title', 'Ghost Clone', 'string'),
  ('description', 'A modern publishing platform built with Elide', 'string'),
  ('logo', '', 'string'),
  ('cover_image', '', 'string'),
  ('icon', '', 'string'),
  ('accent_color', '#15171A', 'string'),
  ('lang', 'en', 'string'),
  ('timezone', 'UTC', 'string'),
  ('codeinjection_head', '', 'string'),
  ('codeinjection_foot', '', 'string'),
  ('facebook', '', 'string'),
  ('twitter', '', 'string'),
  ('navigation', '[]', 'json'),
  ('secondary_navigation', '[]', 'json'),
  ('posts_per_page', '10', 'number'),
  ('comments_enabled', 'true', 'boolean'),
  ('amp_enabled', 'true', 'boolean');

-- Media/Images table
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  size INTEGER,
  width INTEGER,
  height INTEGER,
  type TEXT,
  uploaded_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Webhooks table
CREATE TABLE webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  target_url TEXT NOT NULL,
  name TEXT,
  secret TEXT,
  status TEXT DEFAULT 'active',
  last_triggered_at DATETIME,
  last_triggered_status TEXT,
  last_triggered_error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics/Events table
CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  path TEXT,
  post_id INTEGER,
  user_agent TEXT,
  ip TEXT,
  referer TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Sessions table (for refresh tokens)
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published_at);
CREATE INDEX idx_posts_created ON posts(created_at);

CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_slug ON pages(slug);

CREATE INDEX idx_tags_slug ON tags(slug);

CREATE INDEX idx_posts_tags_post ON posts_tags(post_id);
CREATE INDEX idx_posts_tags_tag ON posts_tags(tag_id);

CREATE INDEX idx_analytics_type ON analytics_events(type);
CREATE INDEX idx_analytics_post ON analytics_events(post_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
