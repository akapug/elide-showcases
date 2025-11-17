/**
 * Example Content Types for a Blog
 * This file demonstrates how to create content types programmatically
 */

import { contentTypeBuilder, componentBuilder } from '../content-types/builder.js';
import { loadConfig } from '../config/loader.js';
import { initializeDatabase } from '../database/connection.js';

async function createBlogContentTypes() {
  // Initialize
  const config = await loadConfig();
  await initializeDatabase(config.database);

  // 1. Create SEO component
  const seoComponent = await componentBuilder.createComponent({
    displayName: 'SEO',
    singularName: 'seo',
    category: 'shared',
    attributes: {
      metaTitle: {
        type: 'string',
        maxLength: 60,
      },
      metaDescription: {
        type: 'text',
        maxLength: 160,
      },
      keywords: {
        type: 'text',
      },
      canonicalURL: {
        type: 'string',
      },
      ogImage: {
        type: 'media',
        allowedTypes: ['images'],
      },
    },
  });

  console.log('✓ Created SEO component');

  // 2. Create Author content type
  const authorType = await contentTypeBuilder.createContentType({
    singularName: 'author',
    pluralName: 'authors',
    displayName: 'Author',
    kind: 'collectionType',
    attributes: {
      name: {
        type: 'string',
        required: true,
      },
      email: {
        type: 'email',
        required: true,
        unique: true,
      },
      bio: {
        type: 'text',
      },
      avatar: {
        type: 'media',
        allowedTypes: ['images'],
      },
      website: {
        type: 'string',
      },
      twitter: {
        type: 'string',
      },
    },
  });

  console.log('✓ Created Author content type');

  // 3. Create Category content type
  const categoryType = await contentTypeBuilder.createContentType({
    singularName: 'category',
    pluralName: 'categories',
    displayName: 'Category',
    kind: 'collectionType',
    attributes: {
      name: {
        type: 'string',
        required: true,
        unique: true,
      },
      slug: {
        type: 'uid',
        targetField: 'name',
      },
      description: {
        type: 'text',
      },
      color: {
        type: 'string',
      },
    },
  });

  console.log('✓ Created Category content type');

  // 4. Create Tag content type
  const tagType = await contentTypeBuilder.createContentType({
    singularName: 'tag',
    pluralName: 'tags',
    displayName: 'Tag',
    kind: 'collectionType',
    attributes: {
      name: {
        type: 'string',
        required: true,
        unique: true,
      },
      slug: {
        type: 'uid',
        targetField: 'name',
      },
    },
  });

  console.log('✓ Created Tag content type');

  // 5. Create Article content type
  const articleType = await contentTypeBuilder.createContentType({
    singularName: 'article',
    pluralName: 'articles',
    displayName: 'Article',
    description: 'Blog articles with rich content',
    kind: 'collectionType',
    draftAndPublish: true,
    attributes: {
      title: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 200,
      },
      slug: {
        type: 'uid',
        targetField: 'title',
        required: true,
      },
      excerpt: {
        type: 'text',
        maxLength: 300,
      },
      content: {
        type: 'richtext',
        required: true,
      },
      coverImage: {
        type: 'media',
        allowedTypes: ['images'],
      },
      author: {
        type: 'relation',
        relation: 'manyToOne',
        target: 'api::author.author',
      },
      category: {
        type: 'relation',
        relation: 'manyToOne',
        target: 'api::category.category',
      },
      tags: {
        type: 'relation',
        relation: 'manyToMany',
        target: 'api::tag.tag',
      },
      seo: {
        type: 'component',
        component: 'shared.seo',
        repeatable: false,
      },
      views: {
        type: 'integer',
        default: 0,
        min: 0,
      },
      featured: {
        type: 'boolean',
        default: false,
      },
      readingTime: {
        type: 'integer',
      },
      status: {
        type: 'enumeration',
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
      },
    },
  });

  console.log('✓ Created Article content type');

  // 6. Create Comment content type
  const commentType = await contentTypeBuilder.createContentType({
    singularName: 'comment',
    pluralName: 'comments',
    displayName: 'Comment',
    kind: 'collectionType',
    attributes: {
      content: {
        type: 'text',
        required: true,
      },
      author: {
        type: 'string',
        required: true,
      },
      email: {
        type: 'email',
        required: true,
      },
      article: {
        type: 'relation',
        relation: 'manyToOne',
        target: 'api::article.article',
      },
      approved: {
        type: 'boolean',
        default: false,
      },
      parentComment: {
        type: 'relation',
        relation: 'manyToOne',
        target: 'api::comment.comment',
      },
    },
  });

  console.log('✓ Created Comment content type');

  // 7. Create Homepage (Single Type)
  const homepageType = await contentTypeBuilder.createContentType({
    singularName: 'homepage',
    pluralName: 'homepage',
    displayName: 'Homepage',
    kind: 'singleType',
    attributes: {
      hero: {
        type: 'component',
        component: 'shared.hero',
      },
      featuredArticles: {
        type: 'relation',
        relation: 'oneToMany',
        target: 'api::article.article',
      },
      seo: {
        type: 'component',
        component: 'shared.seo',
      },
    },
  });

  console.log('✓ Created Homepage content type');

  console.log('\n✅ All blog content types created successfully!');
  console.log('\nYou can now:');
  console.log('  1. Start the server: npm run dev');
  console.log('  2. Access admin panel: http://localhost:1337/admin');
  console.log('  3. Create content using the APIs');

  return {
    seoComponent,
    authorType,
    categoryType,
    tagType,
    articleType,
    commentType,
    homepageType,
  };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createBlogContentTypes()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { createBlogContentTypes };
