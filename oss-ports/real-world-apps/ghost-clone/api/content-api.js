/**
 * Content API
 *
 * Public API for accessing published content.
 * Used by the frontend and can be used by external applications.
 */

export class ContentAPI {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }

  async getPosts(req, res) {
    const {
      page = 1,
      limit = 15,
      filter = '',
      include = '',
      order = 'published_at DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const includes = include.split(',').filter(Boolean);

    // Build query
    let sql = `
      SELECT p.*,
        u.name as author_name,
        u.slug as author_slug,
        u.profile_image as author_image
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
        AND p.visibility = 'public'
        AND p.published_at <= ?
    `;

    const params = [new Date().toISOString()];

    // Apply filters
    if (filter.includes('featured:true')) {
      sql += ' AND p.featured = 1';
    }

    if (filter.includes('tag:')) {
      const tagSlug = filter.match(/tag:([a-z0-9-]+)/)?.[1];
      if (tagSlug) {
        sql += ` AND p.id IN (
          SELECT pt.post_id FROM posts_tags pt
          INNER JOIN tags t ON pt.tag_id = t.id
          WHERE t.slug = ?
        )`;
        params.push(tagSlug);
      }
    }

    // Get total count
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const { total } = await this.db.queryOne(countSql, params);

    // Get posts
    sql += ` ORDER BY ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const posts = await this.db.query(sql, params);

    // Include related data
    if (includes.includes('tags')) {
      for (const post of posts) {
        post.tags = await this.getPostTags(post.id);
      }
    }

    if (includes.includes('author')) {
      for (const post of posts) {
        post.author = await this.getAuthor(post.author_slug);
      }
    }

    return {
      posts: posts.map(p => this.formatPost(p)),
      meta: {
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
          total,
        },
      },
    };
  }

  async getPost(req, res) {
    const { slug } = req.params;
    const { include = '' } = req.query;
    const includes = include.split(',').filter(Boolean);

    const post = await this.db.queryOne(
      `
      SELECT p.*,
        u.name as author_name,
        u.slug as author_slug,
        u.profile_image as author_image,
        u.bio as author_bio
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
        AND p.status = 'published'
        AND p.visibility = 'public'
        AND p.published_at <= ?
      `,
      [slug, new Date().toISOString()]
    );

    if (!post) {
      throw {
        status: 404,
        code: 'POST_NOT_FOUND',
        message: 'Post not found',
      };
    }

    // Always include tags for single post
    post.tags = await this.getPostTags(post.id);

    if (includes.includes('author')) {
      post.author = await this.getAuthor(post.author_slug);
    }

    return {
      post: this.formatPost(post),
    };
  }

  async getRelatedPosts(req, res) {
    const { id } = req.params;
    const { limit = 3 } = req.query;

    // Get post tags
    const tags = await this.getPostTags(id);

    if (tags.length === 0) {
      return { posts: [] };
    }

    const tagIds = tags.map(t => t.id);

    // Find posts with similar tags
    const posts = await this.db.query(
      `
      SELECT DISTINCT p.*,
        u.name as author_name,
        u.slug as author_slug,
        u.profile_image as author_image,
        COUNT(pt.tag_id) as matching_tags
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      INNER JOIN posts_tags pt ON p.id = pt.post_id
      WHERE p.id != ?
        AND p.status = 'published'
        AND p.visibility = 'public'
        AND p.published_at <= ?
        AND pt.tag_id IN (${tagIds.map(() => '?').join(',')})
      GROUP BY p.id
      ORDER BY matching_tags DESC, p.published_at DESC
      LIMIT ?
      `,
      [id, new Date().toISOString(), ...tagIds, parseInt(limit)]
    );

    return {
      posts: posts.map(p => this.formatPost(p)),
    };
  }

  async getPages(req, res) {
    const pages = await this.db.query(
      `
      SELECT p.*,
        u.name as author_name,
        u.slug as author_slug
      FROM pages p
      INNER JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
        AND p.visibility = 'public'
      ORDER BY p.title
      `
    );

    return {
      pages: pages.map(p => this.formatPage(p)),
    };
  }

  async getPage(req, res) {
    const { slug } = req.params;

    const page = await this.db.queryOne(
      `
      SELECT p.*,
        u.name as author_name,
        u.slug as author_slug,
        u.profile_image as author_image
      FROM pages p
      INNER JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
        AND p.status = 'published'
        AND p.visibility = 'public'
      `,
      [slug]
    );

    if (!page) {
      throw {
        status: 404,
        code: 'PAGE_NOT_FOUND',
        message: 'Page not found',
      };
    }

    return {
      page: this.formatPage(page),
    };
  }

  async getTags(req, res) {
    const {
      limit = 50,
      order = 'name ASC',
      include = '',
    } = req.query;

    const includes = include.split(',').filter(Boolean);

    const tags = await this.db.query(
      `
      SELECT t.*,
        COUNT(pt.post_id) as post_count
      FROM tags t
      LEFT JOIN posts_tags pt ON t.id = pt.tag_id
      WHERE t.visibility = 'public'
      GROUP BY t.id
      HAVING post_count > 0
      ORDER BY ${order}
      LIMIT ?
      `,
      [parseInt(limit)]
    );

    return {
      tags: tags.map(t => this.formatTag(t)),
    };
  }

  async getTag(req, res) {
    const { slug } = req.params;
    const { include = '' } = req.query;

    const tag = await this.db.queryOne(
      `
      SELECT t.*,
        COUNT(pt.post_id) as post_count
      FROM tags t
      LEFT JOIN posts_tags pt ON t.id = pt.tag_id
      WHERE t.slug = ? AND t.visibility = 'public'
      GROUP BY t.id
      `,
      [slug]
    );

    if (!tag) {
      throw {
        status: 404,
        code: 'TAG_NOT_FOUND',
        message: 'Tag not found',
      };
    }

    return {
      tag: this.formatTag(tag),
    };
  }

  async getAuthors(req, res) {
    const { limit = 50, order = 'name ASC' } = req.query;

    const authors = await this.db.query(
      `
      SELECT u.*,
        COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
        AND p.status = 'published'
        AND p.visibility = 'public'
      WHERE u.status = 'active'
      GROUP BY u.id
      HAVING post_count > 0
      ORDER BY ${order}
      LIMIT ?
      `,
      [parseInt(limit)]
    );

    return {
      authors: authors.map(a => this.formatAuthor(a)),
    };
  }

  async getAuthor(slug) {
    const author = await this.db.queryOne(
      `
      SELECT u.*,
        COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
        AND p.status = 'published'
        AND p.visibility = 'public'
      WHERE u.slug = ? AND u.status = 'active'
      GROUP BY u.id
      `,
      [slug]
    );

    if (!author) {
      throw {
        status: 404,
        code: 'AUTHOR_NOT_FOUND',
        message: 'Author not found',
      };
    }

    return this.formatAuthor(author);
  }

  async getSettings(req, res) {
    const settings = await this.db.query('SELECT * FROM settings');

    const result = {};
    for (const setting of settings) {
      result[setting.key] = this.parseSettingValue(setting.value, setting.type);
    }

    // Only return public settings
    const publicSettings = {
      title: result.title,
      description: result.description,
      logo: result.logo,
      icon: result.icon,
      accent_color: result.accent_color,
      cover_image: result.cover_image,
      facebook: result.facebook,
      twitter: result.twitter,
      navigation: result.navigation,
      secondary_navigation: result.secondary_navigation,
      lang: result.lang,
      timezone: result.timezone,
    };

    return { settings: publicSettings };
  }

  async getPostTags(postId) {
    return this.db.query(
      `
      SELECT t.*
      FROM tags t
      INNER JOIN posts_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
      ORDER BY pt.sort_order
      `,
      [postId]
    );
  }

  formatPost(post) {
    return {
      id: post.id,
      uuid: post.uuid,
      title: post.title,
      slug: post.slug,
      html: post.html,
      feature_image: post.feature_image,
      featured: Boolean(post.featured),
      visibility: post.visibility,
      published_at: post.published_at,
      custom_excerpt: post.custom_excerpt,
      excerpt: post.custom_excerpt || this.generateExcerpt(post.html),
      tags: post.tags || [],
      primary_tag: post.tags?.[0] || null,
      url: `/${post.slug}`,
      og_image: post.og_image || post.feature_image,
      og_title: post.og_title || post.title,
      og_description: post.og_description || post.custom_excerpt,
      twitter_image: post.twitter_image || post.feature_image,
      twitter_title: post.twitter_title || post.title,
      twitter_description: post.twitter_description || post.custom_excerpt,
      meta_title: post.meta_title || post.title,
      meta_description: post.meta_description || post.custom_excerpt,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: post.author || {
        name: post.author_name,
        slug: post.author_slug,
        profile_image: post.author_image,
      },
    };
  }

  formatPage(page) {
    return {
      id: page.id,
      uuid: page.uuid,
      title: page.title,
      slug: page.slug,
      html: page.html,
      feature_image: page.feature_image,
      visibility: page.visibility,
      published_at: page.published_at,
      custom_excerpt: page.custom_excerpt,
      url: `/page/${page.slug}`,
      meta_title: page.meta_title || page.title,
      meta_description: page.meta_description || page.custom_excerpt,
      created_at: page.created_at,
      updated_at: page.updated_at,
    };
  }

  formatTag(tag) {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      feature_image: tag.feature_image,
      visibility: tag.visibility,
      url: `/tag/${tag.slug}`,
      post_count: tag.post_count || 0,
    };
  }

  formatAuthor(author) {
    return {
      id: author.id,
      name: author.name,
      slug: author.slug,
      profile_image: author.profile_image,
      cover_image: author.cover_image,
      bio: author.bio,
      website: author.website,
      location: author.location,
      facebook: author.facebook,
      twitter: author.twitter,
      url: `/author/${author.slug}`,
      post_count: author.post_count || 0,
    };
  }

  generateExcerpt(html, length = 300) {
    // Strip HTML tags
    const text = html.replace(/<[^>]*>/g, '');

    // Truncate
    if (text.length <= length) {
      return text;
    }

    return text.substring(0, length).trim() + '...';
  }

  parseSettingValue(value, type) {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value);
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      default:
        return value;
    }
  }
}
