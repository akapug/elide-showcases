/**
 * Theme Renderer
 *
 * Renders pages using Handlebars templates from the active theme.
 * Provides helpers for common template operations.
 */

import Handlebars from 'handlebars';
import { readFile, readdir, exists } from 'elide:fs';
import { join } from 'elide:path';
import RSS from 'rss';

export class ThemeRenderer {
  constructor(db, config) {
    this.db = db;
    this.config = config;
    this.templates = new Map();
    this.helpers = {};
    this.partials = {};
  }

  async loadThemes() {
    const themePath = join(this.config.path, this.config.active);

    if (!await exists(themePath)) {
      console.warn(`Theme not found: ${this.config.active}`);
      return;
    }

    console.log(`📦 Loading theme: ${this.config.active}`);

    // Load partials
    const partialsPath = join(themePath, 'partials');
    if (await exists(partialsPath)) {
      await this.loadPartials(partialsPath);
    }

    // Register helpers
    this.registerHelpers();

    // Load templates
    await this.loadTemplates(themePath);

    console.log(`✅ Theme loaded: ${this.config.active}`);
  }

  async loadPartials(partialsPath) {
    const files = await readdir(partialsPath);

    for (const file of files) {
      if (!file.endsWith('.hbs')) continue;

      const name = file.replace('.hbs', '');
      const content = await readFile(join(partialsPath, file), 'utf8');

      Handlebars.registerPartial(name, content);
      this.partials[name] = content;
    }

    console.log(`  Loaded ${Object.keys(this.partials).length} partials`);
  }

  async loadTemplates(themePath) {
    const templates = [
      'index',
      'post',
      'page',
      'tag',
      'author',
      'error',
      'error-404',
    ];

    for (const template of templates) {
      const templatePath = join(themePath, `${template}.hbs`);

      if (await exists(templatePath)) {
        const content = await readFile(templatePath, 'utf8');
        this.templates.set(template, Handlebars.compile(content));
      }
    }

    console.log(`  Loaded ${this.templates.size} templates`);
  }

  registerHelpers() {
    // Date formatting
    Handlebars.registerHelper('date', (date, format) => {
      const d = new Date(date);

      if (format === 'short') {
        return d.toLocaleDateString();
      } else if (format === 'long') {
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } else if (format === 'iso') {
        return d.toISOString();
      }

      return d.toLocaleDateString();
    });

    // Excerpt
    Handlebars.registerHelper('excerpt', (text, length = 200) => {
      if (!text) return '';

      const stripped = text.replace(/<[^>]*>/g, '');

      if (stripped.length <= length) {
        return stripped;
      }

      return stripped.substring(0, length).trim() + '...';
    });

    // URL helper
    Handlebars.registerHelper('url', (path) => {
      return path.startsWith('/') ? path : `/${path}`;
    });

    // Asset helper
    Handlebars.registerHelper('asset', (path) => {
      return `/assets/${path}`;
    });

    // If equals
    Handlebars.registerHelper('eq', (a, b) => {
      return a === b;
    });

    // Conditional helpers
    Handlebars.registerHelper('gt', (a, b) => a > b);
    Handlebars.registerHelper('lt', (a, b) => a < b);
    Handlebars.registerHelper('or', (...args) => {
      return args.slice(0, -1).some(Boolean);
    });

    // JSON stringify
    Handlebars.registerHelper('json', (context) => {
      return JSON.stringify(context);
    });

    // Plural helper
    Handlebars.registerHelper('plural', (count, singular, plural) => {
      return count === 1 ? singular : plural;
    });
  }

  async renderHome(req, res) {
    const page = parseInt(req.query.page || 1);
    const limit = 10;

    // Get posts
    const posts = await this.db.query(
      `
      SELECT p.*,
        u.name as author_name,
        u.slug as author_slug,
        u.profile_image as author_image
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
        AND p.visibility = 'public'
        AND p.published_at <= ?
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
      `,
      [new Date().toISOString(), limit, (page - 1) * limit]
    );

    // Get tags for posts
    for (const post of posts) {
      post.tags = await this.getPostTags(post.id);
    }

    // Get total count
    const { total } = await this.db.queryOne(
      `
      SELECT COUNT(*) as total
      FROM posts
      WHERE status = 'published'
        AND visibility = 'public'
        AND published_at <= ?
      `,
      [new Date().toISOString()]
    );

    const settings = await this.getSettings();

    const context = {
      posts,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        prev: page > 1 ? page - 1 : null,
        next: page < Math.ceil(total / limit) ? page + 1 : null,
      },
      site: settings,
    };

    return this.render('index', context);
  }

  async renderPost(req, res) {
    const { slug } = req.params;

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
      throw { status: 404 };
    }

    post.tags = await this.getPostTags(post.id);

    // Track view
    const settings = await this.getSettings();

    const context = {
      post,
      site: settings,
    };

    return this.render('post', context);
  }

  async renderPage(req, res) {
    const { slug } = req.params;

    const page = await this.db.queryOne(
      `
      SELECT p.*
      FROM pages p
      WHERE p.slug = ?
        AND p.status = 'published'
        AND p.visibility = 'public'
      `,
      [slug]
    );

    if (!page) {
      throw { status: 404 };
    }

    const settings = await this.getSettings();

    const context = {
      page,
      site: settings,
    };

    return this.render('page', context);
  }

  async renderTag(req, res) {
    const { slug } = req.params;
    const page = parseInt(req.query.page || 1);
    const limit = 10;

    // Get tag
    const tag = await this.db.queryOne(
      'SELECT * FROM tags WHERE slug = ? AND visibility = ?',
      [slug, 'public']
    );

    if (!tag) {
      throw { status: 404 };
    }

    // Get posts
    const posts = await this.db.query(
      `
      SELECT p.*,
        u.name as author_name,
        u.slug as author_slug,
        u.profile_image as author_image
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      INNER JOIN posts_tags pt ON p.id = pt.post_id
      WHERE pt.tag_id = ?
        AND p.status = 'published'
        AND p.visibility = 'public'
        AND p.published_at <= ?
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
      `,
      [tag.id, new Date().toISOString(), limit, (page - 1) * limit]
    );

    for (const post of posts) {
      post.tags = await this.getPostTags(post.id);
    }

    const { total } = await this.db.queryOne(
      `
      SELECT COUNT(*) as total
      FROM posts p
      INNER JOIN posts_tags pt ON p.id = pt.post_id
      WHERE pt.tag_id = ?
        AND p.status = 'published'
        AND p.visibility = 'public'
      `,
      [tag.id]
    );

    const settings = await this.getSettings();

    const context = {
      tag,
      posts,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        prev: page > 1 ? page - 1 : null,
        next: page < Math.ceil(total / limit) ? page + 1 : null,
      },
      site: settings,
    };

    return this.render('tag', context);
  }

  async renderAuthor(req, res) {
    const { slug } = req.params;
    const page = parseInt(req.query.page || 1);
    const limit = 10;

    // Get author
    const author = await this.db.queryOne(
      'SELECT * FROM users WHERE slug = ? AND status = ?',
      [slug, 'active']
    );

    if (!author) {
      throw { status: 404 };
    }

    delete author.password;

    // Get posts
    const posts = await this.db.query(
      `
      SELECT p.*
      FROM posts p
      WHERE p.author_id = ?
        AND p.status = 'published'
        AND p.visibility = 'public'
        AND p.published_at <= ?
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
      `,
      [author.id, new Date().toISOString(), limit, (page - 1) * limit]
    );

    for (const post of posts) {
      post.tags = await this.getPostTags(post.id);
    }

    const { total } = await this.db.queryOne(
      `
      SELECT COUNT(*) as total
      FROM posts
      WHERE author_id = ?
        AND status = 'published'
        AND visibility = 'public'
      `,
      [author.id]
    );

    const settings = await this.getSettings();

    const context = {
      author,
      posts,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        prev: page > 1 ? page - 1 : null,
        next: page < Math.ceil(total / limit) ? page + 1 : null,
      },
      site: settings,
    };

    return this.render('author', context);
  }

  async renderRSS(req, res) {
    const settings = await this.getSettings();

    const feed = new RSS({
      title: settings.title,
      description: settings.description,
      feed_url: `${req.protocol}://${req.host}/rss`,
      site_url: `${req.protocol}://${req.host}`,
      language: settings.lang || 'en',
    });

    // Get latest posts
    const posts = await this.db.query(
      `
      SELECT p.*,
        u.name as author_name
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
        AND p.visibility = 'public'
        AND p.published_at <= ?
      ORDER BY p.published_at DESC
      LIMIT 20
      `,
      [new Date().toISOString()]
    );

    for (const post of posts) {
      feed.item({
        title: post.title,
        description: post.custom_excerpt || post.html,
        url: `${req.protocol}://${req.host}/${post.slug}`,
        author: post.author_name,
        date: post.published_at,
      });
    }

    res.setHeader('Content-Type', 'application/rss+xml');
    return feed.xml();
  }

  async renderSitemap(req, res) {
    const settings = await this.getSettings();
    const baseUrl = `${req.protocol}://${req.host}`;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Home page
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Posts
    const posts = await this.db.query(
      `
      SELECT slug, updated_at
      FROM posts
      WHERE status = 'published'
        AND visibility = 'public'
      ORDER BY published_at DESC
      `
    );

    for (const post of posts) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/${post.slug}</loc>\n`;
      xml += `    <lastmod>${post.updated_at}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Pages
    const pages = await this.db.query(
      `
      SELECT slug, updated_at
      FROM pages
      WHERE status = 'published'
        AND visibility = 'public'
      `
    );

    for (const page of pages) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/page/${page.slug}</loc>\n`;
      xml += `    <lastmod>${page.updated_at}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    return xml;
  }

  async renderRobots(req, res) {
    const baseUrl = `${req.protocol}://${req.host}`;

    let txt = 'User-agent: *\n';
    txt += 'Disallow:\n';
    txt += `Sitemap: ${baseUrl}/sitemap.xml\n`;

    res.setHeader('Content-Type', 'text/plain');
    return txt;
  }

  async renderAMP(req, res) {
    const { slug } = req.params;

    const post = await this.db.queryOne(
      `
      SELECT p.*,
        u.name as author_name
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
        AND p.status = 'published'
      `,
      [slug]
    );

    if (!post) {
      throw { status: 404 };
    }

    const settings = await this.getSettings();

    // Simple AMP template
    const html = `
<!doctype html>
<html amp lang="en">
<head>
  <meta charset="utf-8">
  <title>${post.title} - ${settings.title}</title>
  <link rel="canonical" href="${req.protocol}://${req.host}/${post.slug}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
  <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    body { font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 2em; margin-bottom: 10px; }
    .meta { color: #666; margin-bottom: 20px; }
    .content { line-height: 1.6; }
  </style>
</head>
<body>
  <article>
    <h1>${post.title}</h1>
    <div class="meta">
      By ${post.author_name} · ${new Date(post.published_at).toLocaleDateString()}
    </div>
    <div class="content">
      ${post.html}
    </div>
  </article>
</body>
</html>
    `.trim();

    res.setHeader('Content-Type', 'text/html');
    return html;
  }

  async render404(req) {
    const settings = await this.getSettings();

    const context = {
      message: 'Page not found',
      site: settings,
    };

    if (this.templates.has('error-404')) {
      return this.render('error-404', context);
    }

    return this.render('error', context);
  }

  async renderError(error) {
    const settings = await this.getSettings();

    const context = {
      message: error.message || 'An error occurred',
      site: settings,
    };

    return this.render('error', context);
  }

  render(template, context) {
    const tmpl = this.templates.get(template);

    if (!tmpl) {
      // Fallback to basic HTML
      return `
<!DOCTYPE html>
<html>
<head>
  <title>${context.site?.title || 'Blog'}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Template not found: ${template}</h1>
  <p>Please ensure your theme is properly configured.</p>
</body>
</html>
      `.trim();
    }

    return tmpl(context);
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

  async getSettings() {
    const settings = await this.db.query('SELECT * FROM settings');

    const result = {};
    for (const setting of settings) {
      result[setting.key] = this.parseSettingValue(setting.value, setting.type);
    }

    return result;
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
