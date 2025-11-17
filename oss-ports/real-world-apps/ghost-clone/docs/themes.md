# Theme Development Guide

Complete guide to creating custom themes for Ghost Clone.

## Overview

Ghost Clone uses Handlebars templating engine for themes. Themes are simple, powerful, and easy to customize.

## Theme Structure

```
themes/
└── my-theme/
    ├── index.hbs           # Homepage (required)
    ├── post.hbs            # Single post (required)
    ├── page.hbs            # Static page (required)
    ├── tag.hbs             # Tag archive (optional)
    ├── author.hbs          # Author archive (optional)
    ├── error.hbs           # Error page (optional)
    ├── error-404.hbs       # 404 page (optional)
    ├── partials/           # Reusable components
    │   ├── header.hbs
    │   ├── footer.hbs
    │   └── post-card.hbs
    └── assets/             # Static assets
        ├── css/
        │   └── style.css
        ├── js/
        │   └── main.js
        └── images/
```

## Getting Started

### 1. Create Theme Directory

```bash
mkdir themes/my-theme
cd themes/my-theme
```

### 2. Create Required Templates

**index.hbs** - Homepage
```handlebars
<!DOCTYPE html>
<html lang="{{site.lang}}">
<head>
  <meta charset="UTF-8">
  <title>{{site.title}}</title>
  <link rel="stylesheet" href="{{asset 'css/style.css'}}">
</head>
<body>
  {{> header}}

  <main>
    {{#if posts}}
      {{#each posts}}
        {{> post-card}}
      {{/each}}
    {{/if}}
  </main>

  {{> footer}}
</body>
</html>
```

**post.hbs** - Single Post
```handlebars
<!DOCTYPE html>
<html lang="{{site.lang}}">
<head>
  <meta charset="UTF-8">
  <title>{{post.title}} - {{site.title}}</title>
  <meta name="description" content="{{post.meta_description}}">
</head>
<body>
  {{> header}}

  <article>
    <h1>{{post.title}}</h1>
    <div class="post-content">
      {{{post.html}}}
    </div>
  </article>

  {{> footer}}
</body>
</html>
```

**page.hbs** - Static Page
```handlebars
<!DOCTYPE html>
<html lang="{{site.lang}}">
<head>
  <meta charset="UTF-8">
  <title>{{page.title}} - {{site.title}}</title>
</head>
<body>
  {{> header}}

  <article>
    <h1>{{page.title}}</h1>
    {{{page.html}}}
  </article>

  {{> footer}}
</body>
</html>
```

### 3. Create Partials

**partials/header.hbs**
```handlebars
<header>
  <h1><a href="/">{{site.title}}</a></h1>
  <nav>
    <ul>
      {{#each site.navigation}}
        <li><a href="{{url}}">{{label}}</a></li>
      {{/each}}
    </ul>
  </nav>
</header>
```

**partials/footer.hbs**
```handlebars
<footer>
  <p>&copy; {{date created_at format="YYYY"}} {{site.title}}</p>
  <p>Powered by Elide</p>
</footer>
```

**partials/post-card.hbs**
```handlebars
<article class="post-card">
  {{#if feature_image}}
    <img src="{{feature_image}}" alt="{{title}}">
  {{/if}}

  <h2><a href="{{url slug}}">{{title}}</a></h2>

  {{#if custom_excerpt}}
    <p>{{custom_excerpt}}</p>
  {{else}}
    <p>{{excerpt html words=30}}</p>
  {{/if}}

  <div class="post-meta">
    <span>{{author.name}}</span>
    <time>{{date published_at format='long'}}</time>
  </div>
</article>
```

### 4. Add Styles

**assets/css/style.css**
```css
body {
  font-family: -apple-system, sans-serif;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  padding: 40px 0;
  border-bottom: 1px solid #eee;
}

.post-card {
  margin: 40px 0;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.post-card img {
  width: 100%;
  border-radius: 4px;
}

footer {
  text-align: center;
  padding: 40px 0;
  border-top: 1px solid #eee;
  margin-top: 60px;
}
```

### 5. Activate Theme

In `config/index.js` or environment config:
```javascript
themes: {
  active: 'my-theme',
  path: './themes'
}
```

## Template Context

### Site Context (`site`)

Available in all templates:
```javascript
{
  title: "My Blog",
  description: "A modern blog",
  logo: "/content/images/logo.png",
  icon: "/content/images/icon.png",
  cover_image: "/content/images/cover.jpg",
  navigation: [
    {label: "Home", url: "/"},
    {label: "About", url: "/about"}
  ],
  secondary_navigation: [...],
  lang: "en",
  timezone: "UTC"
}
```

### Post Context (`post`)

Available in `post.hbs`:
```javascript
{
  id: 1,
  uuid: "abc-123",
  title: "My Post",
  slug: "my-post",
  html: "<p>Content...</p>",
  markdown: "# Content",
  feature_image: "/images/feature.jpg",
  featured: false,
  status: "published",
  visibility: "public",
  published_at: "2024-01-15T10:00:00Z",
  custom_excerpt: "Brief description",
  tags: [
    {id: 1, name: "Tech", slug: "tech"}
  ],
  author: {
    name: "John Doe",
    slug: "john-doe",
    profile_image: "/images/john.jpg",
    bio: "Writer"
  },
  meta_title: "SEO Title",
  meta_description: "SEO description",
  og_image: "/images/og.jpg",
  url: "/my-post"
}
```

### Posts Context (`posts`)

Available in `index.hbs`, `tag.hbs`, `author.hbs`:
```javascript
{
  posts: [...],  // Array of post objects
  pagination: {
    page: 1,
    pages: 5,
    total: 47,
    prev: null,
    next: 2
  }
}
```

### Tag Context (`tag`)

Available in `tag.hbs`:
```javascript
{
  id: 1,
  name: "Technology",
  slug: "technology",
  description: "Tech posts",
  feature_image: "/images/tag.jpg",
  post_count: 12
}
```

### Author Context (`author`)

Available in `author.hbs`:
```javascript
{
  id: 1,
  name: "John Doe",
  slug: "john-doe",
  profile_image: "/images/john.jpg",
  cover_image: "/images/cover.jpg",
  bio: "Writer and developer",
  website: "https://johndoe.com",
  location: "San Francisco",
  facebook: "johndoe",
  twitter: "@johndoe",
  post_count: 25
}
```

## Handlebars Helpers

### Built-in Helpers

**date** - Format dates
```handlebars
{{date published_at format='long'}}
{{date published_at format='short'}}
{{date published_at format='iso'}}
```

**excerpt** - Generate excerpts
```handlebars
{{excerpt html words=30}}
```

**url** - Generate URLs
```handlebars
{{url slug}}
{{url "about"}}
```

**asset** - Reference theme assets
```handlebars
{{asset 'css/style.css'}}
{{asset 'js/main.js'}}
{{asset 'images/logo.png'}}
```

**eq** - Equality check
```handlebars
{{#if (eq status 'published')}}
  Published
{{/if}}
```

**gt/lt** - Comparisons
```handlebars
{{#if (gt post_count 10)}}
  Popular author
{{/if}}
```

**or** - Logical OR
```handlebars
{{#if (or featured sticky)}}
  Important post
{{/if}}
```

**json** - Output as JSON
```handlebars
<script>
  const post = {{{json post}}};
</script>
```

**plural** - Pluralization
```handlebars
{{post_count}} {{plural post_count 'post' 'posts'}}
```

## Advanced Features

### Custom Templates

Create custom templates for specific posts/pages:

**post-custom.hbs**
```handlebars
<!-- Custom template for special posts -->
```

Specify in post frontmatter:
```markdown
---
template: custom
---
```

### Dynamic Navigation

```handlebars
<nav>
  {{#each site.navigation}}
    <a href="{{url}}"
       class="{{#if active}}active{{/if}}">
      {{label}}
    </a>
  {{/each}}
</nav>
```

### Featured Posts

```handlebars
{{#foreach posts}}
  {{#if featured}}
    <article class="featured">
      <!-- Featured post -->
    </article>
  {{/if}}
{{/foreach}}
```

### Pagination

```handlebars
{{#if pagination}}
  <nav class="pagination">
    {{#if pagination.prev}}
      <a href="?page={{pagination.prev}}">← Newer</a>
    {{/if}}

    <span>Page {{pagination.page}} of {{pagination.pages}}</span>

    {{#if pagination.next}}
      <a href="?page={{pagination.next}}">Older →</a>
    {{/if}}
  </nav>
{{/if}}
```

### SEO Meta Tags

```handlebars
<head>
  <title>{{meta_title}}</title>
  <meta name="description" content="{{meta_description}}">

  <!-- Open Graph -->
  <meta property="og:title" content="{{og_title}}">
  <meta property="og:description" content="{{og_description}}">
  <meta property="og:image" content="{{og_image}}">
  <meta property="og:url" content="{{url}}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{twitter_title}}">
  <meta name="twitter:description" content="{{twitter_description}}">
  <meta name="twitter:image" content="{{twitter_image}}">
</head>
```

### Social Sharing

```handlebars
<div class="share">
  <a href="https://twitter.com/intent/tweet?text={{title}}&url={{url slug}}"
     target="_blank">
    Share on Twitter
  </a>

  <a href="https://www.facebook.com/sharer.php?u={{url slug}}"
     target="_blank">
    Share on Facebook
  </a>
</div>
```

### Code Highlighting

```handlebars
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
```

### Comments Integration

**Disqus**
```handlebars
<div id="disqus_thread"></div>
<script>
  var disqus_config = function () {
    this.page.url = '{{url slug}}';
    this.page.identifier = '{{id}}';
  };
  (function() {
    var d = document, s = d.createElement('script');
    s.src = 'https://your-site.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  })();
</script>
```

## Best Practices

### 1. Responsive Design
```css
@media (max-width: 768px) {
  .post-card {
    flex-direction: column;
  }
}
```

### 2. Performance
- Minimize CSS/JS files
- Optimize images
- Use lazy loading
- Enable caching

### 3. Accessibility
- Use semantic HTML
- Add alt text to images
- Ensure keyboard navigation
- Use ARIA labels

### 4. SEO
- Include meta tags
- Use structured data
- Generate sitemap
- Optimize images

### 5. Browser Support
- Test in multiple browsers
- Use prefixes for CSS
- Provide fallbacks

## Testing

### 1. Test Locally
```bash
npm run dev
```

### 2. Check All Pages
- Homepage
- Single post
- Tag archive
- Author page
- 404 page

### 3. Validate HTML
```bash
npm run validate
```

### 4. Test Responsiveness
- Mobile devices
- Tablets
- Desktop

## Packaging Theme

Create a `package.json`:
```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "description": "A custom theme",
  "author": "Your Name",
  "templates": [
    "index",
    "post",
    "page",
    "tag",
    "author",
    "error"
  ]
}
```

Package for distribution:
```bash
tar -czf my-theme.tar.gz my-theme/
```

## Examples

See included themes:
- `casper` - Default Ghost-style theme
- `minimal` - Minimalist design
- `magazine` - Magazine layout

## Resources

- [Handlebars Documentation](https://handlebarsjs.com/)
- [Ghost Theme Documentation](https://ghost.org/docs/themes/)
- [Theme Examples](https://github.com/elide/ghost-clone-themes)
