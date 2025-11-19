/**
 * Admin API
 *
 * Protected API for content management.
 * Requires authentication and appropriate permissions.
 */

import { marked } from 'marked';
import { randomBytes } from 'crypto';

export class AdminAPI {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }

  // ========== Posts ==========

  async listPosts(req, res) {
    const {
      page = 1,
      limit = 15,
      status = '',
      author = '',
      tag = '',
      order = 'updated_at DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT p.*,
        u.name as author_name,
        u.slug as author_slug
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (author) {
      sql += ' AND u.slug = ?';
      params.push(author);
    }

    if (tag) {
      sql += ` AND p.id IN (
        SELECT pt.post_id FROM posts_tags pt
        INNER JOIN tags t ON pt.tag_id = t.id
        WHERE t.slug = ?
      )`;
      params.push(tag);
    }

    // Get total
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const { total } = await this.db.queryOne(countSql, params);

    // Get posts
    sql += ` ORDER BY ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const posts = await this.db.query(sql, params);

    // Get tags for each post
    for (const post of posts) {
      post.tags = await this.getPostTags(post.id);
    }

    return {
      posts,
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
    const { id } = req.params;

    const post = await this.db.queryOne(
      `
      SELECT p.*,
        u.name as author_name,
        u.slug as author_slug
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
      `,
      [id]
    );

    if (!post) {
      throw {
        status: 404,
        code: 'POST_NOT_FOUND',
        message: 'Post not found',
      };
    }

    post.tags = await this.getPostTags(post.id);

    return { post };
  }

  async createPost(req, res) {
    const data = await req.json();

    // Validate
    if (!data.title) {
      throw {
        status: 400,
        code: 'MISSING_TITLE',
        message: 'Title is required',
      };
    }

    // Generate slug if not provided
    if (!data.slug) {
      data.slug = this.slugify(data.title);
    }

    // Ensure unique slug
    data.slug = await this.ensureUniqueSlug('posts', data.slug);

    // Generate UUID
    data.uuid = randomBytes(16).toString('hex');

    // Convert markdown to HTML
    if (data.markdown) {
      data.html = marked(data.markdown);
    }

    // Set author
    data.author_id = req.user.id;

    // Set timestamps
    const now = new Date().toISOString();
    data.created_at = now;
    data.updated_at = now;

    // Extract tags
    const tags = data.tags || [];
    delete data.tags;

    // Create post
    const postId = await this.db.create('posts', data);

    // Associate tags
    if (tags.length > 0) {
      await this.setPostTags(postId, tags);
    }

    // Return created post
    const post = await this.db.findById('posts', postId);
    post.tags = await this.getPostTags(postId);

    return { post };
  }

  async updatePost(req, res) {
    const { id } = req.params;
    const data = await req.json();

    // Check if post exists
    const existing = await this.db.findById('posts', id);

    if (!existing) {
      throw {
        status: 404,
        code: 'POST_NOT_FOUND',
        message: 'Post not found',
      };
    }

    // Check permissions
    if (req.user.role === 'author' && existing.author_id !== req.user.id) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'You can only edit your own posts',
      };
    }

    // Update slug if title changed
    if (data.title && data.title !== existing.title && !data.slug) {
      data.slug = this.slugify(data.title);
      data.slug = await this.ensureUniqueSlug('posts', data.slug, id);
    } else if (data.slug && data.slug !== existing.slug) {
      data.slug = await this.ensureUniqueSlug('posts', data.slug, id);
    }

    // Convert markdown to HTML
    if (data.markdown) {
      data.html = marked(data.markdown);
    }

    // Update timestamp
    data.updated_at = new Date().toISOString();

    // Extract tags
    const tags = data.tags;
    delete data.tags;

    // Update post
    await this.db.update('posts', id, data);

    // Update tags if provided
    if (tags !== undefined) {
      await this.setPostTags(id, tags);
    }

    // Return updated post
    const post = await this.db.findById('posts', id);
    post.tags = await this.getPostTags(id);

    return { post };
  }

  async deletePost(req, res) {
    const { id } = req.params;

    const post = await this.db.findById('posts', id);

    if (!post) {
      throw {
        status: 404,
        code: 'POST_NOT_FOUND',
        message: 'Post not found',
      };
    }

    await this.db.delete('posts', id);

    return { success: true };
  }

  async publishPost(req, res) {
    const { id } = req.params;

    const post = await this.db.findById('posts', id);

    if (!post) {
      throw {
        status: 404,
        code: 'POST_NOT_FOUND',
        message: 'Post not found',
      };
    }

    await this.db.update('posts', id, {
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  }

  async unpublishPost(req, res) {
    const { id } = req.params;

    const post = await this.db.findById('posts', id);

    if (!post) {
      throw {
        status: 404,
        code: 'POST_NOT_FOUND',
        message: 'Post not found',
      };
    }

    await this.db.update('posts', id, {
      status: 'draft',
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  }

  // ========== Pages ==========

  async listPages(req, res) {
    const {
      page = 1,
      limit = 15,
      status = '',
      order = 'updated_at DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT p.*,
        u.name as author_name,
        u.slug as author_slug
      FROM pages p
      INNER JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const { total } = await this.db.queryOne(countSql, params);

    sql += ` ORDER BY ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const pages = await this.db.query(sql, params);

    return {
      pages,
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

  async createPage(req, res) {
    const data = await req.json();

    if (!data.title) {
      throw {
        status: 400,
        code: 'MISSING_TITLE',
        message: 'Title is required',
      };
    }

    if (!data.slug) {
      data.slug = this.slugify(data.title);
    }

    data.slug = await this.ensureUniqueSlug('pages', data.slug);
    data.uuid = randomBytes(16).toString('hex');

    if (data.markdown) {
      data.html = marked(data.markdown);
    }

    data.author_id = req.user.id;

    const now = new Date().toISOString();
    data.created_at = now;
    data.updated_at = now;

    const pageId = await this.db.create('pages', data);
    const pageData = await this.db.findById('pages', pageId);

    return { page: pageData };
  }

  async updatePage(req, res) {
    const { id } = req.params;
    const data = await req.json();

    const existing = await this.db.findById('pages', id);

    if (!existing) {
      throw {
        status: 404,
        code: 'PAGE_NOT_FOUND',
        message: 'Page not found',
      };
    }

    if (data.markdown) {
      data.html = marked(data.markdown);
    }

    data.updated_at = new Date().toISOString();

    await this.db.update('pages', id, data);

    const pageData = await this.db.findById('pages', id);

    return { page: pageData };
  }

  async deletePage(req, res) {
    const { id } = req.params;

    const pageData = await this.db.findById('pages', id);

    if (!pageData) {
      throw {
        status: 404,
        code: 'PAGE_NOT_FOUND',
        message: 'Page not found',
      };
    }

    await this.db.delete('pages', id);

    return { success: true };
  }

  // ========== Tags ==========

  async listTags(req, res) {
    const { order = 'name ASC' } = req.query;

    const tags = await this.db.query(
      `
      SELECT t.*,
        COUNT(pt.post_id) as post_count
      FROM tags t
      LEFT JOIN posts_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY ${order}
      `
    );

    return { tags };
  }

  async createTag(req, res) {
    const data = await req.json();

    if (!data.name) {
      throw {
        status: 400,
        code: 'MISSING_NAME',
        message: 'Tag name is required',
      };
    }

    if (!data.slug) {
      data.slug = this.slugify(data.name);
    }

    data.slug = await this.ensureUniqueSlug('tags', data.slug);

    const now = new Date().toISOString();
    data.created_at = now;
    data.updated_at = now;

    const tagId = await this.db.create('tags', data);
    const tag = await this.db.findById('tags', tagId);

    return { tag };
  }

  async updateTag(req, res) {
    const { id } = req.params;
    const data = await req.json();

    const existing = await this.db.findById('tags', id);

    if (!existing) {
      throw {
        status: 404,
        code: 'TAG_NOT_FOUND',
        message: 'Tag not found',
      };
    }

    data.updated_at = new Date().toISOString();

    await this.db.update('tags', id, data);

    const tag = await this.db.findById('tags', id);

    return { tag };
  }

  async deleteTag(req, res) {
    const { id } = req.params;

    const tag = await this.db.findById('tags', id);

    if (!tag) {
      throw {
        status: 404,
        code: 'TAG_NOT_FOUND',
        message: 'Tag not found',
      };
    }

    await this.db.delete('tags', id);

    return { success: true };
  }

  // ========== Users ==========

  async listUsers(req, res) {
    const { order = 'name ASC' } = req.query;

    const users = await this.db.query(
      `
      SELECT u.*,
        COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      GROUP BY u.id
      ORDER BY ${order}
      `
    );

    // Remove passwords
    users.forEach(u => delete u.password);

    return { users };
  }

  async getUser(req, res) {
    const { id } = req.params;

    const user = await this.db.findById('users', id);

    if (!user) {
      throw {
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      };
    }

    // Only allow users to see their own details or admins
    if (req.user.id !== user.id && req.user.role !== 'admin') {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'Access denied',
      };
    }

    delete user.password;

    return { user };
  }

  async createUser(req, res) {
    const data = await req.json();

    if (!data.name || !data.email || !data.password) {
      throw {
        status: 400,
        code: 'MISSING_FIELDS',
        message: 'Name, email, and password are required',
      };
    }

    // Check if email exists
    const existing = await this.db.findOne('users', { email: data.email });

    if (existing) {
      throw {
        status: 400,
        code: 'EMAIL_EXISTS',
        message: 'Email already in use',
      };
    }

    // Generate slug
    if (!data.slug) {
      data.slug = this.slugify(data.name);
    }

    data.slug = await this.ensureUniqueSlug('users', data.slug);

    // Hash password
    const bcrypt = await import('bcrypt');
    data.password = await bcrypt.hash(data.password, 10);

    const now = new Date().toISOString();
    data.created_at = now;
    data.updated_at = now;

    const userId = await this.db.create('users', data);
    const user = await this.db.findById('users', userId);

    delete user.password;

    return { user };
  }

  async updateUser(req, res) {
    const { id } = req.params;
    const data = await req.json();

    const existing = await this.db.findById('users', id);

    if (!existing) {
      throw {
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      };
    }

    // Only allow users to update themselves or admins
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'Access denied',
      };
    }

    // Don't allow role changes unless admin
    if (data.role && req.user.role !== 'admin') {
      delete data.role;
    }

    // Hash password if provided
    if (data.password) {
      const bcrypt = await import('bcrypt');
      data.password = await bcrypt.hash(data.password, 10);
    }

    data.updated_at = new Date().toISOString();

    await this.db.update('users', id, data);

    const user = await this.db.findById('users', id);
    delete user.password;

    return { user };
  }

  async deleteUser(req, res) {
    const { id } = req.params;

    const user = await this.db.findById('users', id);

    if (!user) {
      throw {
        status: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      };
    }

    // Can't delete yourself
    if (req.user.id === parseInt(id)) {
      throw {
        status: 400,
        code: 'CANNOT_DELETE_SELF',
        message: 'Cannot delete your own account',
      };
    }

    await this.db.delete('users', id);

    return { success: true };
  }

  // ========== Settings ==========

  async getSettings(req, res) {
    const settings = await this.db.query('SELECT * FROM settings');

    const result = {};
    for (const setting of settings) {
      result[setting.key] = this.parseSettingValue(setting.value, setting.type);
    }

    return { settings: result };
  }

  async updateSettings(req, res) {
    const data = await req.json();

    for (const [key, value] of Object.entries(data)) {
      const existing = await this.db.findOne('settings', { key });

      const stringValue = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

      if (existing) {
        await this.db.update('settings', existing.id, {
          value: stringValue,
          updated_at: new Date().toISOString(),
        });
      } else {
        await this.db.create('settings', {
          key,
          value: stringValue,
          type: typeof value === 'object' ? 'json' : typeof value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    return { success: true };
  }

  // ========== Helper Methods ==========

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

  async setPostTags(postId, tags) {
    // Remove existing tags
    await this.db.execute('DELETE FROM posts_tags WHERE post_id = ?', [postId]);

    // Add new tags
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      let tagId;

      if (typeof tag === 'object' && tag.id) {
        tagId = tag.id;
      } else {
        // Find or create tag by name/slug
        const tagSlug = typeof tag === 'string' ? this.slugify(tag) : tag.slug;
        let existingTag = await this.db.findOne('tags', { slug: tagSlug });

        if (!existingTag) {
          const tagName = typeof tag === 'string' ? tag : tag.name;
          tagId = await this.db.create('tags', {
            name: tagName,
            slug: tagSlug,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          tagId = existingTag.id;
        }
      }

      await this.db.create('posts_tags', {
        post_id: postId,
        tag_id: tagId,
        sort_order: i,
      });
    }
  }

  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  async ensureUniqueSlug(table, slug, excludeId = null) {
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const conditions = { slug: uniqueSlug };
      const existing = await this.db.findOne(table, conditions);

      if (!existing || (excludeId && existing.id === excludeId)) {
        break;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
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
