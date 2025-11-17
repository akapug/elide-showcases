/**
 * SEO Service
 *
 * Generates SEO metadata, structured data, and social sharing tags.
 */

export class SEOService {
  constructor(config) {
    this.config = config;
  }

  generateMetaTags(data) {
    const {
      title,
      description,
      image,
      url,
      type = 'website',
      author,
      publishedAt,
      modifiedAt,
    } = data;

    const tags = [];

    // Basic meta tags
    tags.push({ name: 'description', content: description });

    // Open Graph
    tags.push({ property: 'og:title', content: title });
    tags.push({ property: 'og:description', content: description });
    tags.push({ property: 'og:type', content: type });
    tags.push({ property: 'og:url', content: url });

    if (image) {
      tags.push({ property: 'og:image', content: image });
    }

    // Twitter Card
    tags.push({ name: 'twitter:card', content: this.config.twitterCard });
    tags.push({ name: 'twitter:title', content: title });
    tags.push({ name: 'twitter:description', content: description });

    if (image) {
      tags.push({ name: 'twitter:image', content: image });
    }

    // Article-specific
    if (type === 'article') {
      if (author) {
        tags.push({ property: 'article:author', content: author });
      }

      if (publishedAt) {
        tags.push({ property: 'article:published_time', content: publishedAt });
      }

      if (modifiedAt) {
        tags.push({ property: 'article:modified_time', content: modifiedAt });
      }
    }

    return tags;
  }

  generateStructuredData(data) {
    const { type, title, description, image, url, author, publishedAt, modifiedAt } = data;

    if (type === 'article') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: description,
        image: image,
        url: url,
        author: {
          '@type': 'Person',
          name: author,
        },
        datePublished: publishedAt,
        dateModified: modifiedAt || publishedAt,
      };
    } else if (type === 'website') {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: title,
        description: description,
        url: url,
      };
    }

    return null;
  }

  renderMetaTags(tags) {
    return tags.map(tag => {
      if (tag.property) {
        return `<meta property="${tag.property}" content="${this.escapeHtml(tag.content)}">`;
      } else {
        return `<meta name="${tag.name}" content="${this.escapeHtml(tag.content)}">`;
      }
    }).join('\n');
  }

  renderStructuredData(data) {
    if (!data) {
      return '';
    }

    return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
  }

  escapeHtml(text) {
    if (!text) return '';

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
