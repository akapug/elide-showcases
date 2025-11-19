# Content Type Guide

Complete guide to creating and managing content types in Elide CMS.

## Table of Contents

1. [Introduction](#introduction)
2. [Field Types](#field-types)
3. [Relations](#relations)
4. [Components](#components)
5. [Dynamic Zones](#dynamic-zones)
6. [Lifecycle Hooks](#lifecycle-hooks)
7. [Best Practices](#best-practices)

## Introduction

Content types are the foundation of your CMS. They define the structure and fields of your content.

### Types of Content Types

- **Collection Type**: Multiple entries (e.g., Articles, Products)
- **Single Type**: Single entry (e.g., Homepage, Settings)
- **Component**: Reusable field groups

## Field Types

### Text Fields

#### String
Short text field (max 255 characters).

```javascript
{
  "title": {
    "type": "string",
    "required": true,
    "minLength": 1,
    "maxLength": 100
  }
}
```

#### Text
Long text without formatting.

```javascript
{
  "description": {
    "type": "text",
    "maxLength": 1000
  }
}
```

#### Rich Text
Formatted text with HTML support.

```javascript
{
  "content": {
    "type": "richtext"
  }
}
```

#### Email
Validated email address.

```javascript
{
  "email": {
    "type": "email",
    "required": true,
    "unique": true
  }
}
```

#### Password
Hashed password field.

```javascript
{
  "password": {
    "type": "password",
    "required": true,
    "minLength": 8
  }
}
```

#### UID
Unique identifier, auto-generated from another field.

```javascript
{
  "slug": {
    "type": "uid",
    "targetField": "title"
  }
}
```

### Number Fields

#### Integer
Whole numbers.

```javascript
{
  "views": {
    "type": "integer",
    "default": 0,
    "min": 0
  }
}
```

#### Float/Decimal
Decimal numbers.

```javascript
{
  "price": {
    "type": "decimal",
    "required": true,
    "min": 0,
    "precision": 10,
    "scale": 2
  }
}
```

### Boolean

```javascript
{
  "published": {
    "type": "boolean",
    "default": false
  }
}
```

### Date & Time

```javascript
{
  "publishedAt": {
    "type": "datetime"
  },
  "eventDate": {
    "type": "date"
  },
  "eventTime": {
    "type": "time"
  }
}
```

### Enumeration

Dropdown with predefined values.

```javascript
{
  "status": {
    "type": "enumeration",
    "enum": ["draft", "published", "archived"],
    "default": "draft"
  }
}
```

### JSON

Flexible JSON object.

```javascript
{
  "metadata": {
    "type": "json"
  }
}
```

### Media

File upload field.

```javascript
{
  "coverImage": {
    "type": "media",
    "allowedTypes": ["images"],
    "multiple": false
  },
  "gallery": {
    "type": "media",
    "allowedTypes": ["images", "videos"],
    "multiple": true
  }
}
```

## Relations

### One-to-One

Each entry relates to exactly one other entry.

```javascript
{
  "author": {
    "type": "relation",
    "relation": "oneToOne",
    "target": "api::user.user"
  }
}
```

### One-to-Many

One entry relates to multiple entries.

```javascript
// In Article content type
{
  "comments": {
    "type": "relation",
    "relation": "oneToMany",
    "target": "api::comment.comment",
    "mappedBy": "article"
  }
}

// In Comment content type
{
  "article": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "api::article.article",
    "inversedBy": "comments"
  }
}
```

### Many-to-One

Multiple entries relate to one entry.

```javascript
{
  "category": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "api::category.category"
  }
}
```

### Many-to-Many

Multiple entries relate to multiple entries.

```javascript
{
  "tags": {
    "type": "relation",
    "relation": "manyToMany",
    "target": "api::tag.tag"
  }
}
```

## Components

Reusable field groups that can be shared across content types.

### Creating a Component

```javascript
// Component: product.specification
{
  "singularName": "specification",
  "category": "product",
  "displayName": "Specification",
  "attributes": {
    "key": {
      "type": "string",
      "required": true
    },
    "value": {
      "type": "string",
      "required": true
    }
  }
}
```

### Using Components

```javascript
// In Product content type
{
  "specifications": {
    "type": "component",
    "component": "product.specification",
    "repeatable": true
  }
}
```

### Nested Components

```javascript
{
  "address": {
    "type": "component",
    "component": "user.address",
    "repeatable": false
  }
}

// Component: user.address
{
  "attributes": {
    "street": { "type": "string" },
    "city": { "type": "string" },
    "country": { "type": "string" },
    "zipCode": { "type": "string" }
  }
}
```

## Dynamic Zones

Flexible content areas that can contain different components.

```javascript
{
  "blocks": {
    "type": "dynamiczone",
    "components": [
      "content.text-block",
      "content.image-block",
      "content.video-block",
      "content.quote-block"
    ]
  }
}
```

### Example Components for Dynamic Zone

```javascript
// content.text-block
{
  "attributes": {
    "content": { "type": "richtext" }
  }
}

// content.image-block
{
  "attributes": {
    "image": { "type": "media" },
    "caption": { "type": "string" }
  }
}

// content.video-block
{
  "attributes": {
    "url": { "type": "string" },
    "title": { "type": "string" }
  }
}
```

## Lifecycle Hooks

Add custom logic to content type events.

```javascript
import { lifecycleHooks } from '../webhooks/lifecycle.js';

// Before creating
lifecycleHooks.register('api::article.article', 'beforeCreate', async (ctx) => {
  const { data } = ctx;

  // Auto-generate slug
  if (!data.slug && data.title) {
    data.slug = slugify(data.title);
  }

  // Set author from user
  if (ctx.user) {
    data.authorId = ctx.user.id;
  }
});

// After creating
lifecycleHooks.register('api::article.article', 'afterCreate', async (ctx) => {
  const { data } = ctx;

  // Send notification
  await sendNotification({
    type: 'article.created',
    articleId: data.id
  });
});

// Before updating
lifecycleHooks.register('api::article.article', 'beforeUpdate', async (ctx) => {
  const { data, where } = ctx;

  // Update updated_at timestamp
  data.updatedAt = new Date();
});

// After updating
lifecycleHooks.register('api::article.article', 'afterUpdate', async (ctx) => {
  const { data } = ctx;

  // Clear cache
  await clearCache(`article:${data.id}`);
});

// Before deleting
lifecycleHooks.register('api::article.article', 'beforeDelete', async (ctx) => {
  const { where } = ctx;

  // Archive related data
  await archiveRelatedData(where.id);
});

// After deleting
lifecycleHooks.register('api::article.article', 'afterDelete', async (ctx) => {
  const { data } = ctx;

  // Log deletion
  console.log(`Article ${data.id} deleted`);
});
```

## Best Practices

### 1. Naming Conventions

- Use camelCase for field names: `firstName`, `publishedAt`
- Use singular for content type name: `article`, not `articles`
- Use descriptive names: `coverImage` instead of `img`

### 2. Field Requirements

- Mark essential fields as `required: true`
- Use appropriate min/max length validations
- Set sensible default values

### 3. Relations

- Always define inverse relations
- Use appropriate relation types
- Consider performance impact of deep nesting

### 4. Components

- Create components for reusable field groups
- Keep components focused and single-purpose
- Use descriptive category names

### 5. Performance

- Add indexes on frequently queried fields
- Limit the number of relations per content type
- Use pagination for large collections

### 6. Security

- Never expose sensitive data
- Use field-level permissions
- Validate all input data

### 7. Validation

```javascript
{
  "email": {
    "type": "email",
    "required": true,
    "unique": true,
    "regex": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  },
  "website": {
    "type": "string",
    "regex": "^https?:\\/\\/"
  },
  "age": {
    "type": "integer",
    "min": 0,
    "max": 150
  }
}
```

### 8. Draft & Publish

Enable draft & publish for content that needs editorial workflow:

```javascript
{
  "kind": "collectionType",
  "draftAndPublish": true,
  "attributes": {
    // ...
  }
}
```

### 9. Localization

Enable i18n for multi-language content:

```javascript
{
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "title": {
      "type": "string",
      "pluginOptions": {
        "i18n": {
          "localized": true
        }
      }
    }
  }
}
```

## Complete Example

### Blog System

```javascript
// Article content type
{
  "singularName": "article",
  "pluralName": "articles",
  "displayName": "Article",
  "kind": "collectionType",
  "draftAndPublish": true,
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "minLength": 1,
      "maxLength": 200
    },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true
    },
    "excerpt": {
      "type": "text",
      "maxLength": 300
    },
    "content": {
      "type": "richtext",
      "required": true
    },
    "coverImage": {
      "type": "media",
      "allowedTypes": ["images"]
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::author.author"
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category"
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag"
    },
    "seo": {
      "type": "component",
      "component": "shared.seo",
      "repeatable": false
    },
    "blocks": {
      "type": "dynamiczone",
      "components": [
        "content.text",
        "content.image",
        "content.video",
        "content.quote"
      ]
    },
    "views": {
      "type": "integer",
      "default": 0,
      "min": 0
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "publishedAt": {
      "type": "datetime"
    }
  }
}

// SEO Component
{
  "singularName": "seo",
  "category": "shared",
  "displayName": "SEO",
  "attributes": {
    "metaTitle": {
      "type": "string",
      "maxLength": 60
    },
    "metaDescription": {
      "type": "text",
      "maxLength": 160
    },
    "keywords": {
      "type": "text"
    },
    "canonicalURL": {
      "type": "string"
    }
  }
}
```

This creates a complete blog system with:
- Articles with rich content
- SEO optimization
- Author and category relations
- Tags for organization
- Dynamic content blocks
- Draft/publish workflow
- View tracking

---

For more information, see the [API Documentation](API.md) and [Plugin Development Guide](PLUGIN_GUIDE.md).
